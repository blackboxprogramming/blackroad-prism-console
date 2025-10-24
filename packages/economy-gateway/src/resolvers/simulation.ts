import EventEmitter from 'eventemitter3';
import { GraphQLScalarType, Kind } from 'graphql';
import { join, relative } from 'path';
import fs from 'fs-extra';
import {
  runSimulation,
  timeseriesToCsv,
  timeseriesToSvg,
  buildEvidenceReport,
  Scenario,
  SimulationRunResult
} from '@blackroad/tokenomics-sim';
import { SimulationQueue, SimulationJob } from '../jobs/queue';
import { startWorker } from '../jobs/worker';
import { assertRole, Role } from '../auth/rbac';
import { hashArtifact, signEvidence } from '../audit/evidenceHash';
import { startSpan } from '../otel';

interface ArtifactRecord {
  kind: string;
  url: string;
  bytes: number;
  hash: string;
}

interface SimulationRecord {
  id: string;
  modelVersion: string;
  seed: number;
  scenario: Scenario;
  status: 'CREATED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  finishedAt?: string;
  artifacts: ArtifactRecord[];
  summary: SimulationRunResult['summary'];
  evidenceHash?: string;
  violations: SimulationRunResult['violations'];
}

interface SimulationContext {
  role: Role;
}

const MODEL_VERSION = process.env.TOKENOMICS_MODEL_VERSION ?? '2024.10.0';
const ARTIFACT_ROOT = join(process.cwd(), 'artifacts', 'tokenomics');

const simulations = new Map<string, SimulationRecord>();
const events = new EventEmitter();
const queue = new SimulationQueue();
let simulationSequence = 0;

function generateId() {
  simulationSequence += 1;
  return `sim_${Date.now().toString(36)}_${simulationSequence.toString(36)}`;
}

function clone(record: SimulationRecord): SimulationRecord {
  return JSON.parse(JSON.stringify(record));
}

function ensureRecord(id: string): SimulationRecord {
  const record = simulations.get(id);
  if (!record) {
    throw new Error(`Simulation ${id} not found`);
  }
  return record;
}

async function writeArtifacts(id: string, result: SimulationRunResult, simulation: SimulationRecord) {
  const span = startSpan('artifact.write');
  const dir = join(ARTIFACT_ROOT, id);
  await fs.ensureDir(dir);

  const timeseriesPath = join(dir, 'timeseries.csv');
  const evidencePath = join(dir, 'evidence.md');
  const plotPath = join(dir, 'plots.svg');

  const csv = timeseriesToCsv(result.points);
  const svg = timeseriesToSvg(result.points);
  const evidence = buildEvidenceReport({
    simulationId: id,
    input: { modelVersion: simulation.modelVersion, scenario: simulation.scenario, seed: simulation.seed },
    result,
    violations: result.violations
  });

  await Promise.all([
    fs.writeFile(timeseriesPath, `${csv}\n`),
    fs.writeFile(plotPath, svg),
    fs.writeFile(evidencePath, `${evidence}\n`)
  ]);

  span.end();
  return { timeseriesPath, plotPath, evidencePath, runDir: dir };
}

async function processJob(job: SimulationJob) {
  const simulation = ensureRecord(job.simulationId);
  simulation.status = 'RUNNING';
  simulation.startedAt = new Date().toISOString();
  events.emit('simulation', clone(simulation));

  const runSpan = startSpan('simulate.run');
  try {
    const result = runSimulation({
      scenario: simulation.scenario,
      seed: simulation.seed,
      modelVersion: simulation.modelVersion
    });

    simulation.summary = result.summary;
    simulation.violations = result.violations;

    const { timeseriesPath, plotPath, evidencePath, runDir } = await writeArtifacts(job.simulationId, result, simulation);

    const evidenceArtifact = hashArtifact(evidencePath);
    simulation.evidenceHash = signEvidence(job.simulationId, simulation.modelVersion, evidenceArtifact.hash);

    const runPath = join(runDir, 'run.json');
    await fs.writeFile(
      runPath,
      JSON.stringify(
        {
          simulationId: job.simulationId,
          modelVersion: simulation.modelVersion,
          seed: simulation.seed,
          scenario: simulation.scenario,
          summary: result.summary,
          violations: result.violations,
          evidenceHash: simulation.evidenceHash
        },
        null,
        2
      )
    );

    const artifacts: ArtifactRecord[] = [
      {
        kind: 'timeseries',
        url: relative(process.cwd(), timeseriesPath),
        ...hashArtifact(timeseriesPath)
      },
      {
        kind: 'plots',
        url: relative(process.cwd(), plotPath),
        ...hashArtifact(plotPath)
      },
      {
        kind: 'evidence',
        url: relative(process.cwd(), evidencePath),
        ...evidenceArtifact
      },
      {
        kind: 'run',
        url: relative(process.cwd(), runPath),
        ...hashArtifact(runPath)
      }
    ];

    simulation.artifacts = artifacts;
    simulation.status = 'COMPLETED';
    simulation.finishedAt = new Date().toISOString();
    console.log('[audit] EvidenceCreated', {
      simulationId: job.simulationId,
      evidenceHash: simulation.evidenceHash
    });
    events.emit('simulation', clone(simulation));
  } catch (error) {
    simulation.status = 'FAILED';
    simulation.finishedAt = new Date().toISOString();
    simulation.artifacts = [];
    simulation.summary = { finalSupply: 0, maxInflation: 0, breaches: ['execution'] };
    console.error('[economy-gateway] simulation failed', error);
    events.emit('simulation', clone(simulation));
  } finally {
    runSpan.end();
  }
}

startWorker(queue, processJob);

const parseJsonLiteral = (ast: any): unknown => {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return Number(ast.value);
    case Kind.NULL:
      return null;
    case Kind.OBJECT: {
      const obj: Record<string, unknown> = {};
      ast.fields.forEach((field: any) => {
        obj[field.name.value] = parseJsonLiteral(field.value);
      });
      return obj;
    }
    case Kind.LIST:
      return ast.values.map((value: any) => parseJsonLiteral(value));
    default:
      return null;
  }
};

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: parseJsonLiteral
});

export const resolvers = {
  JSON: JSONScalar,
  Query: {
    simulation: (_: unknown, { id }: { id: string }) => {
      const record = simulations.get(id);
      return record ? clone(record) : null;
    }
  },
  Mutation: {
    simulationCreate: (
      _: unknown,
      { scenario, seed }: { scenario: Scenario; seed?: number },
      context: SimulationContext
    ) => {
      assertRole(context.role, ['operator']);
      const id = generateId();
      const record: SimulationRecord = {
        id,
        modelVersion: MODEL_VERSION,
        seed: seed ?? Math.floor(Math.random() * 10_000),
        scenario: scenario as Scenario,
        status: 'CREATED',
        startedAt: new Date().toISOString(),
        artifacts: [],
        summary: { finalSupply: 0, maxInflation: 0, breaches: [] },
        violations: []
      };
      simulations.set(id, record);
      events.emit('simulation', clone(record));
      return clone(record);
    },
    simulationRun: (_: unknown, { id }: { id: string }, context: SimulationContext) => {
      assertRole(context.role, ['operator']);
      const record = ensureRecord(id);
      if (record.status === 'RUNNING') {
        return clone(record);
      }
      queue.enqueue({ simulationId: id });
      return clone(record);
    }
  },
  Subscription: {
    simulationEvents: {
      subscribe: async function* (_: unknown, { id }: { id?: string }) {
        if (id) {
          const existing = simulations.get(id);
          if (existing) {
            yield clone(existing);
          }
        } else {
          simulations.forEach((record) => {
            // eslint-disable-next-line no-useless-return
            return;
          });
        }

        const iterator = (async function* () {
          while (true) {
            const payload: SimulationRecord = await new Promise((resolve) => {
              const handler = (record: SimulationRecord) => {
                if (!id || record.id === id) {
                  events.off('simulation', handler);
                  resolve(clone(record));
                }
              };
              events.on('simulation', handler);
            });
            yield payload;
          }
        })();

        for await (const payload of iterator) {
          yield payload;
        }
      },
      resolve: (payload: SimulationRecord) => payload
    }
  }
};

export function createContext({ request }: { request?: Request }): SimulationContext {
  const headerRole = request?.headers.get('x-role') ?? request?.headers.get('X-Role');
  const role: Role = headerRole === 'operator' ? 'operator' : 'viewer';
  return { role };
}
