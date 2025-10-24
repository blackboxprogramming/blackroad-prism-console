import { readFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { runCahnHilliard } from '@blackroad/graph-engines/cahn-hilliard/semi_implicit';
import { createPhaseField } from '@blackroad/graph-engines/cahn-hilliard/grid';
import { writePhaseFieldArtifact } from '@blackroad/graph-engines/io/artifacts';
import { TelemetryHandle, endTelemetry } from '../../lib/telemetry';
import { assertCapability } from '../../lib/auth';
import { loadConfig } from '../../lib/config';

interface GraphPhaseOptions {
  seed: number;
  outDir: string;
  initPath: string;
  steps: number;
  telemetry: TelemetryHandle;
}

function parsePhase(path: string) {
  const json = JSON.parse(readFileSync(path, 'utf8'));
  const field = createPhaseField(json.width, json.height);
  if (!Array.isArray(json.values) || json.values.length !== field.values.length) {
    throw new Error('invalid phase field JSON');
  }
  for (let i = 0; i < json.values.length; i += 1) {
    field.values[i] = Number(json.values[i]);
  }
  return field;
}

export async function runGraphPhase(options: GraphPhaseOptions) {
  const config = loadConfig();
  assertCapability(config, 'graph:phase');
  try {
    const init = parsePhase(resolve(process.cwd(), options.initPath));
    const result = runCahnHilliard({ field: init }, {
      epsilon: 1.2,
      dt: 0.05,
      steps: options.steps,
      recordEvery: 10
    });
    mkdirSync(options.outDir, { recursive: true });
    result.frames.forEach((frame, index) => {
      writePhaseFieldArtifact(frame, { directory: resolve(options.outDir, `frame_${index}`) });
    });
    console.log(`[graph] phase evolution complete: ${result.frames.length} frames`);
  } finally {
    endTelemetry(options.telemetry);
  }
}
