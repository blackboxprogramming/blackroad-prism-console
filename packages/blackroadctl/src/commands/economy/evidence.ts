import { readFileSync } from 'fs';
import { resolve } from 'path';
import EconomyClient, { type SimulationArtifact } from '@blackroad/economy-sdk';
import { loadConfig } from '../../lib/config';
import { assertCapability } from '../../lib/auth';
import { endTelemetry, TelemetryHandle } from '../../lib/telemetry';

interface EconomyEvidenceOptions {
  id: string;
  open?: boolean;
  telemetry: TelemetryHandle;
}

export async function runEconomyEvidence(options: EconomyEvidenceOptions) {
  const config = loadConfig();
  assertCapability(config, 'economy:evidence');

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

    const evidenceArtifact = simulation.artifacts.find(
      (artifact: SimulationArtifact) => artifact.kind === 'evidence'
    );
    if (!evidenceArtifact) {
      console.log('No evidence artifact found for this simulation');
      return;
    }

    const evidencePath = resolve(process.cwd(), evidenceArtifact.url);
    console.log(`[economy] evidence path ${evidencePath}`);
    console.log(`[economy] evidence hash ${simulation.evidenceHash ?? evidenceArtifact.hash}`);

    if (options.open) {
      const contents = readFileSync(evidencePath, 'utf8');
      console.log('--- evidence.md ---');
      console.log(contents);
    }
  } finally {
    endTelemetry(options.telemetry);
  }
}
