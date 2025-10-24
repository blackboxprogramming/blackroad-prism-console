import type { ChatMessage } from './store';

interface SlackBridgeOptions {
  fetchImpl?: typeof fetch;
  channelId?: string;
  botToken?: string;
}

function redact(text: string, redactions: string[]): string {
  return redactions.reduce((acc, token) => acc.replaceAll(token, '█'.repeat(token.length)), text);
}

export async function mirrorToSlack(message: ChatMessage, options: SlackBridgeOptions = {}): Promise<void> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const token = options.botToken ?? process.env.SLACK_BOT_TOKEN;
  const channel = options.channelId ?? process.env.SLACK_CHANNEL_ID;
  if (!fetchImpl || !token || !channel) return;

  const text = redact(`*${message.author}* (${message.role}) — ${message.text}`, message.redactions);
  const attachments = (message.attachments ?? []).slice(0, 3).map((item) => ({
    text: `${item.kind.toUpperCase()}: ${item.url}`,
  }));

  await fetchImpl('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ channel, text, attachments }),
  });
}
