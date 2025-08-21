/* <!-- FILE: /apps/web/app/api/ai/stream/route.ts --> */

export const runtime = 'edge';

const buckets = new Map<string, { count: number; reset: number }>();
const LIMIT = 60;
const WINDOW_MS = 60_000;

export function rateLimit(key: string, limit: number = LIMIT) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (bucket && now < bucket.reset) {
    if (bucket.count >= limit) return false;
    bucket.count += 1;
    return true;
  }
  buckets.set(key, { count: 1, reset: now + WINDOW_MS });
  return true;
}

interface ChatMessage {
  role: string;
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  tools?: unknown[];
  system?: string;
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
  if (!rateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: 'rate_limit_exceeded' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'invalid_json' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { messages, tools, system } = body || {};
  if (!Array.isArray(messages)) {
    return new Response(
      JSON.stringify({ error: 'messages_required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const controller = new AbortController();

  const upstream = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      stream: true,
      messages,
      tools,
      system,
    }),
    signal: controller.signal,
  });

  if (!upstream.ok || !upstream.body) {
    const err = await upstream.text();
    return new Response(err || upstream.statusText, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const reader = upstream.body!.getReader();
      const push = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }
          if (value) controller.enqueue(value);
          push();
        }).catch((err) => controller.error(err));
      };
      push();
    },
    cancel() {
      controller.abort();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

/* Example client usage:
fetch('/api/ai/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] })
}).then(async (res) => {
  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log(decoder.decode(value));
  }
});
*/

