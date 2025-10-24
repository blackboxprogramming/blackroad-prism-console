import { readFileSync } from 'fs';
import { resolve } from 'path';
import EconomyClient, { type SimulationArtifact } from '@blackroad/economy-sdk';
import { loadConfig } from '../../lib/config';
import { assertCapability } from '../../lib/auth';
import { endTelemetry, TelemetryHandle } from '../../lib/telemetry';

const SPARK = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

interface EconomyGraphOptions {
  id: string;
  metric: 'circulating' | 'totalSupply' | 'inflation';
  telemetry: TelemetryHandle;
}

function renderSparkline(values: number[]): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((value) => {
      const idx = Math.round(((value - min) / range) * (SPARK.length - 1));
      return SPARK[idx];
    })
    .join('');
}

export async function runEconomyGraph(options: EconomyGraphOptions) {
  const config = loadConfig();
  assertCapability(config, 'economy:graph');

  if (!['circulating', 'totalSupply', 'inflation'].includes(options.metric)) {
    throw new Error(`Unsupported metric '${options.metric}'`);
  }

  const client = new EconomyClient({
    endpoint: config.economyEndpoint,
    token: config.economyToken,
    devToken: config.economyDevToken
  });

  try {
    const simulation = await client.getSimulation(options.id);
    if (!simulation) {
      throw new Error(`Simulation ${options.id} not found`);
    }

    const csvArtifact = simulation.artifacts.find(
      (artifact: SimulationArtifact) => artifact.kind === 'timeseries'
    );
    if (!csvArtifact) {
      console.log('No timeseries artifact found.');
      return;
    }

    const csvPath = resolve(process.cwd(), csvArtifact.url);
    const csv = readFileSync(csvPath, 'utf8').trim();
    const [headerLine, ...rows] = csv.split(/\r?\n/);
    const headers = headerLine.split(',');
    const headerName = options.metric === 'inflation' ? 'inflationPct' : options.metric;
    const metricIndex = headers.indexOf(headerName);
    if (metricIndex === -1) {
      throw new Error(`Metric ${options.metric} not found in CSV headers`);
    }
    const monthsIndex = headers.indexOf('date');

    const values: number[] = [];
    const labels: string[] = [];
    rows.forEach((row) => {
      const parts = row.split(',');
      labels.push(parts[monthsIndex]);
      values.push(Number(parts[metricIndex]));
    });

    console.log(`[economy] ${options.metric} sparkline`);
    console.log(renderSparkline(values));
    console.log(`start ${labels[0]} => ${values[0].toFixed(2)}, end ${labels[labels.length - 1]} => ${values[values.length - 1].toFixed(2)}`);
  } finally {
    endTelemetry(options.telemetry);
  }
}
