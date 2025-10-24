import fs from 'node:fs/promises';
import path from 'node:path';
import { interpolate } from '@blackroad/sb-engine';
import { endTelemetry, TelemetryHandle } from '../../lib/telemetry';

interface JobPayload {
  coupling: number[];
  rows: number;
  cols: number;
  sourcePoints: number[][];
  targetPoints: number[][];
}

export interface FrameOptions {
  jobPath: string;
  times: number[];
  telemetry: TelemetryHandle;
}

export async function runSinkhornFrames(options: FrameOptions) {
  try {
    const payloadPath = path.join(options.jobPath, 'result.json');
    const raw = await fs.readFile(payloadPath, 'utf8');
    const payload = JSON.parse(raw) as JobPayload;
    const coupling = Float64Array.from(payload.coupling);
    const frames = interpolate(coupling, payload.sourcePoints, payload.targetPoints, options.times, {
      rows: payload.rows,
      cols: payload.cols
    });

    const outPath = path.join(options.jobPath, `frames-${Date.now()}.webm`);
    const artifact = {
      format: 'sb.frames',
      version: 1,
      frames
    };
    await fs.writeFile(outPath, JSON.stringify(artifact));
    console.log(`frames exported to ${outPath}`);
    return outPath;
  } finally {
    endTelemetry(options.telemetry);
  }
}
