import { CaptionsClient } from '@blackroad/control-plane-sdk';
import { loadConfig } from '../../lib/config';
import { assertCapability } from '../../lib/auth';
import { endTelemetry, TelemetryHandle } from '../../lib/telemetry';

export interface CaptionStatusOptions {
  jobId: string;
  watch?: boolean;
  intervalMs?: number;
  telemetry: TelemetryHandle;
}

export async function runCaptionStatus(options: CaptionStatusOptions): Promise<void> {
  const config = loadConfig();
  assertCapability(config, 'media:caption:status');

  const client = new CaptionsClient({
    endpoint: config.endpoint,
    token: config.token,
    devToken: config.devToken
  });

  try {
    if (options.watch) {
      await watchJob(client, options);
    } else {
      const job = await client.job(options.jobId);
      console.log(JSON.stringify(job, null, 2));
    }
  } finally {
    endTelemetry(options.telemetry);
  }
}

async function watchJob(client: CaptionsClient, options: CaptionStatusOptions): Promise<void> {
  const interval = options.intervalMs ?? 2000;
  let active = true;

  while (active) {
    const job = await client.job(options.jobId);
    console.log(JSON.stringify(job, null, 2));
    if (!job || job.status === 'COMPLETE' || job.status === 'FAILED') {
      active = false;
    } else {
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
}
