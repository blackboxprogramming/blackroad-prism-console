import { loadConfig } from '../../lib/config';
import { assertCapability, authHeaders } from '../../lib/auth';
import { TelemetryHandle, endTelemetry } from '../../lib/telemetry';

export interface ObsTailOptions {
  filter?: string;
  limit?: number;
  telemetry: TelemetryHandle;
}

interface ParsedEventStream {
  eventCount: number;
}

async function readEventStream(response: Response, limit: number): Promise<ParsedEventStream> {
  if (!response.body) {
    throw new Error('Gateway response missing body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let eventCount = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx = buffer.indexOf('\n\n');
    while (idx !== -1) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      idx = buffer.indexOf('\n\n');

      if (!frame.startsWith('data:')) continue;
      const payload = frame.slice(5).trim();
      if (!payload) continue;
      const parsed = JSON.parse(payload);
      // eslint-disable-next-line no-console
      console.log(parsed);
      eventCount += 1;
      if (eventCount >= limit) {
        await reader.cancel();
        return { eventCount };
      }
    }
  }

  return { eventCount };
}

export async function runObsTail(options: ObsTailOptions): Promise<void> {
  const config = loadConfig();
  assertCapability(config, 'obs:tail');

  const endpoint = new URL(config.endpoint);
  endpoint.pathname = '/events/stream';
  const params = new URLSearchParams();
  if (options.filter) {
    params.set('filter', options.filter);
  }
  endpoint.search = params.toString();

  const limit = options.limit ?? 50;

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'text/event-stream',
        ...authHeaders(config),
      },
    });

    if (!response.ok) {
      throw new Error(`Gateway request failed: ${response.status} ${response.statusText}`);
    }

    const result = await readEventStream(response, limit);
    if (result.eventCount === 0) {
      // eslint-disable-next-line no-console
      console.log('No events matched filter.');
    }
  } finally {
    endTelemetry(options.telemetry);
  }
}

