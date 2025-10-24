import { loadConfig } from '../../lib/config';
import { assertCapability, authHeaders } from '../../lib/auth';
import { endTelemetry, TelemetryHandle } from '../../lib/telemetry';

interface ChatPostOptions {
  jobId: string;
  text: string;
  attachments?: string[];
  telemetry: TelemetryHandle;
}

function parseAttachment(entry: string) {
  const [kind, url] = entry.split(':', 2);
  if (!kind || !url) {
    throw new Error(`Invalid attachment format '${entry}'. Expected kind:url.`);
  }
  return { kind, url };
}

export async function runChatPost(options: ChatPostOptions) {
  const config = loadConfig();
  assertCapability(config, 'chat:post');

  const baseUrl = process.env.OBS_GATEWAY_BASE_URL ?? 'http://localhost:4800';
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/chat/post`;
  const attachments = options.attachments?.map(parseAttachment);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(config),
      },
      body: JSON.stringify({ jobId: options.jobId, text: options.text, attachments }),
    });

    if (!response.ok) {
      throw new Error(`Failed to post chat message (${response.status})`);
    }

    const message = await response.json();
    console.log(JSON.stringify(message, null, 2));
  } finally {
    endTelemetry(options.telemetry);
  }
}
