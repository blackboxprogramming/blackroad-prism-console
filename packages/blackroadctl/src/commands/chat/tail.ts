import { loadConfig } from '../../lib/config';
import { assertCapability, authHeaders } from '../../lib/auth';
import { endTelemetry, TelemetryHandle } from '../../lib/telemetry';

interface ChatTailOptions {
  jobId?: string;
  telemetry: TelemetryHandle;
}

export async function runChatTail(options: ChatTailOptions) {
  const config = loadConfig();
  assertCapability(config, 'chat:tail');

  const baseUrl = process.env.OBS_GATEWAY_BASE_URL ?? 'http://localhost:4800';
  const url = new URL('/events/stream', baseUrl);
  url.searchParams.set('topic', 'chat');
  if (options.jobId) {
    url.searchParams.set('jobId', options.jobId);
  }

  const controller = new AbortController();
  process.on('SIGINT', () => {
    controller.abort();
  });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        ...authHeaders(config),
      },
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Failed to tail chat events (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let index;
      while ((index = buffer.indexOf('\n\n')) !== -1) {
        const chunk = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        if (!chunk.trim()) continue;
        const lines = chunk.split('\n');
        let event = 'message';
        let data = '';
        for (const line of lines) {
          if (line.startsWith('event:')) {
            event = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            data += line.slice(5).trim();
          }
        }
        if (event === 'heartbeat') {
          console.log(`[heartbeat] ${data}`);
          continue;
        }
        if (!data) continue;
        try {
          const payload = JSON.parse(data);
          console.log(`[${payload.ts}] ${payload.author ?? payload.role}: ${payload.text}`);
        } catch (error) {
          console.warn('Failed to parse chat payload', error);
        }
      }
    }
  } catch (error) {
    if (controller.signal.aborted) {
      console.log('Chat tail aborted.');
    } else {
      throw error;
    }
  } finally {
    endTelemetry(options.telemetry);
  }
}
