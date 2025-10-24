import fs from 'fs';
import path from 'path';
import { configureTelemetry } from '../../lib/telemetry';

export type OtInterpolateOptions = {
  job: string;
  t: number;
  out?: string;
};

export async function runOtInterpolate(options: OtInterpolateOptions) {
  const telemetry = configureTelemetry('ot.interpolate');
  const jobPath = path.resolve(options.job);
  if (!fs.existsSync(jobPath)) {
    throw new Error(`Job file not found: ${jobPath}`);
  }
  const summary = JSON.parse(fs.readFileSync(jobPath, 'utf8'));
  if (summary.kind !== 'dynamic') {
    throw new Error('Interpolation currently supports dynamic OT jobs only');
  }
  const framesPath = path.join(path.dirname(jobPath), 'frames.json');
  if (!fs.existsSync(framesPath)) {
    throw new Error('frames.json not found next to job.json');
  }
  const framesPayload = JSON.parse(fs.readFileSync(framesPath, 'utf8'));
  const frames = framesPayload.frames as { width: number; height: number; data: number[] }[];
  const clamped = Math.max(0, Math.min(1, options.t));
  const index = Math.round(clamped * (frames.length - 1));
  const frame = frames[index];
  const outDir = path.resolve(options.out ?? path.dirname(jobPath));
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outPath = path.join(outDir, `frame-${index}.json`);
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        index,
        width: frame.width,
        height: frame.height,
        data: frame.data,
      },
      null,
      2
    )
  );
  telemetry.span.finish();
  // eslint-disable-next-line no-console
  console.log(`Frame ${index} written to ${outPath}`);
}
