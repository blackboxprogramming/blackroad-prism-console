import { CaptionsClient, CaptionCreateInput } from '@blackroad/control-plane-sdk';
import { loadConfig } from '../../lib/config';
import { assertCapability } from '../../lib/auth';
import { endTelemetry, TelemetryHandle } from '../../lib/telemetry';

export interface CaptionCreateOptions {
  assetId: string;
  source: string;
  backend?: string;
  lang?: string;
  telemetry: TelemetryHandle;
}

export async function runCaptionCreate(options: CaptionCreateOptions): Promise<void> {
  const config = loadConfig();
  assertCapability(config, 'media:caption:create');

  const client = new CaptionsClient({
    endpoint: config.endpoint,
    token: config.token,
    devToken: config.devToken
  });

  try {
    const payload: CaptionCreateInput = {
      assetId: options.assetId,
      source: options.source,
      backend: options.backend ?? 'local',
      lang: options.lang ?? 'en'
    };
    const job = await client.create(payload);
    console.log(JSON.stringify(job, null, 2));
  } finally {
    endTelemetry(options.telemetry);
  }
}
