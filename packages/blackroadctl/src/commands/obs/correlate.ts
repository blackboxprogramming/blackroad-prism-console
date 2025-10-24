import { loadConfig } from '../../lib/config';
import { assertCapability, authHeaders } from '../../lib/auth';
import { TelemetryHandle, endTelemetry } from '../../lib/telemetry';

export interface ObsCorrelateOptions {
  key: string;
  keyType: 'traceId' | 'releaseId' | 'assetId' | 'simId';
  telemetry: TelemetryHandle;
}

interface GraphQlResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

interface CorrelatePayload {
  correlate: {
    key: string;
    keyType: string;
    notes: string[];
    timeline: { ts: string; source: string; service: string; kind: string }[];
  };
}

export async function runObsCorrelate(options: ObsCorrelateOptions): Promise<void> {
  const config = loadConfig();
  assertCapability(config, 'obs:correlate');

  const payload = {
    query:
      'query($key: String!, $keyType: String!) { correlate(key: $key, keyType: $keyType) { key keyType notes timeline { ts source service kind } } }',
    variables: { key: options.key, keyType: options.keyType },
  };

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(config),
      },
      body: JSON.stringify(payload),
    });

    const json = (await response.json()) as GraphQlResponse<CorrelatePayload>;
    if (json.errors?.length) {
      const [error] = json.errors;
      throw new Error(error.message);
    }

    if (!json.data) {
      throw new Error('Gateway returned empty response');
    }

    const { key, keyType, notes, timeline } = json.data.correlate;
    // eslint-disable-next-line no-console
    console.log(`Correlation ${keyType}:${key}`);
    for (const note of notes) {
      // eslint-disable-next-line no-console
      console.log(`• ${note}`);
    }
    for (const event of timeline) {
      // eslint-disable-next-line no-console
      console.log(`- [${event.ts}] ${event.source}/${event.service} (${event.kind})`);
    }
  } finally {
    endTelemetry(options.telemetry);
  }
}

