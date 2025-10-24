import { readFileSync, copyFileSync, mkdirSync } from 'fs';
import { join, basename, resolve } from 'path';
import EconomyClient, { type SimulationArtifact } from '@blackroad/economy-sdk';
import { loadConfig } from '../../lib/config';
import { assertCapability } from '../../lib/auth';
import { endTelemetry, TelemetryHandle } from '../../lib/telemetry';

interface EconomySimulateOptions {
  scenarioPath: string;
  seed?: number;
  out?: string;
  telemetry: TelemetryHandle;
}

export async function runEconomySimulate(options: EconomySimulateOptions) {
  const config = loadConfig();
  assertCapability(config, 'economy:simulate');

  const scenarioFile = resolve(process.cwd(), options.scenarioPath);
  const scenario = JSON.parse(readFileSync(scenarioFile, 'utf8'));

  const client = new EconomyClient({
    endpoint: config.economyEndpoint,
    token: config.economyToken,
    devToken: config.economyDevToken
  });

  try {
    const created = await client.createSimulation({ scenario, seed: options.seed });
    console.log(`[economy] created simulation ${created.id} (model ${created.modelVersion})`);

    await client.runSimulation(created.id);

    for await (const event of client.subscribeSimulationEvents(created.id, 750)) {
      console.log(`[economy] status=${event.status}`);
    }

    const completed = await client.getSimulation(created.id);
    if (!completed) {
      throw new Error('Simulation disappeared before completion');
    }

    console.log(`[economy] evidence hash ${completed.evidenceHash ?? 'n/a'}`);

    if (options.out && completed.artifacts.length) {
      const targetDir = resolve(options.out);
      mkdirSync(targetDir, { recursive: true });
      completed.artifacts.forEach((artifact: SimulationArtifact) => {
        const source = resolve(process.cwd(), artifact.url);
        const dest = join(targetDir, basename(source));
        copyFileSync(source, dest);
      });
      console.log(`[economy] artifacts copied to ${targetDir}`);
    }
  } finally {
    endTelemetry(options.telemetry);
  }
}
