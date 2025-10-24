import fs from 'node:fs/promises';
import path from 'node:path';
import { nanoid } from 'nanoid';
import {
  computeCostMatrix,
  logSinkhorn,
  barycentric,
  interpolate,
  writeArtifacts,
  type CostMatrixOptions
} from '@blackroad/sb-engine';
import { endTelemetry, TelemetryHandle } from '../../lib/telemetry';

interface DistributionFile {
  points: number[][];
  weights: number[];
}

export interface SinkhornRunOptions {
  muPath: string;
  nuPath: string;
  epsilon: number;
  iters: number;
  tol: number;
  cost: CostMatrixOptions['metric'];
  outDir: string;
  telemetry: TelemetryHandle;
}

interface RunResultMeta {
  id: string;
  config: Omit<SinkhornRunOptions, 'telemetry'>;
  diagnostics: {
    iterations: number;
    marginalError: number;
    dualGap: number | null;
  };
  artifacts: {
    pi: string;
    map: string;
    diagnostics: string;
    frames: string;
  };
}

async function loadDistribution(filePath: string): Promise<DistributionFile> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as DistributionFile;
}

export async function runSinkhornCli(options: SinkhornRunOptions) {
  try {
    const [muFile, nuFile] = await Promise.all([
      loadDistribution(options.muPath),
      loadDistribution(options.nuPath)
    ]);
    const mu = Float64Array.from(muFile.weights);
    const nu = Float64Array.from(nuFile.weights);
    const { matrix, rows, cols } = computeCostMatrix(muFile.points, nuFile.points, {
      metric: options.cost,
      cosineNormalize: true
    });

    const result = logSinkhorn(mu, nu, matrix, rows, cols, {
      epsilon: options.epsilon,
      maxIterations: options.iters,
      tolerance: options.tol,
      checkInterval: 5
    });

    const bary = barycentric(result.coupling, nuFile.points, { rows, cols });
    const frames = interpolate(result.coupling, muFile.points, nuFile.points, [0, 0.25, 0.5, 0.75, 1], {
      rows,
      cols
    });

    const jobId = nanoid();
    const jobDir = path.join(options.outDir, jobId);
    await fs.rm(jobDir, { recursive: true, force: true });
    const artifacts = await writeArtifacts({
      directory: jobDir,
      coupling: result.coupling,
      rows,
      cols,
      barycentric: bary.map,
      diagnostics: result.diagnostics,
      frames
    });

    const meta: RunResultMeta = {
      id: jobId,
      config: {
        muPath: options.muPath,
        nuPath: options.nuPath,
        epsilon: options.epsilon,
        iters: options.iters,
        tol: options.tol,
        cost: options.cost,
        outDir: options.outDir
      },
      diagnostics: {
        iterations: result.iterations,
        marginalError: result.diagnostics.marginalError,
        dualGap: result.history[result.history.length - 1]?.dualGap ?? null
      },
      artifacts: {
        pi: artifacts.piPath,
        map: artifacts.mapPath,
        diagnostics: artifacts.diagnosticsPath,
        frames: artifacts.framesPath
      }
    };

    const summaryPath = path.join(jobDir, 'job.json');
    const payloadPath = path.join(jobDir, 'result.json');
    await fs.writeFile(summaryPath, JSON.stringify(meta, null, 2));
    await fs.writeFile(
      payloadPath,
      JSON.stringify(
        {
          coupling: Array.from(result.coupling),
          rows,
          cols,
          sourcePoints: muFile.points,
          targetPoints: nuFile.points
        },
        null,
        2
      )
    );

    console.log(`sb-run completed: job ${jobId}`);
    console.log(`artifacts stored in ${jobDir}`);
    return { jobId, jobDir };
  } finally {
    endTelemetry(options.telemetry);
  }
}
