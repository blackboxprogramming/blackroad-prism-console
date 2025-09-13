import { readFileSync } from 'fs';
import { join } from 'path';

addEventListener('fetch', (event) => {
  event.respondWith(handle(event.request));
});

async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop() as string;
  try {
    const file = join(process.cwd(), 'sites', 'blackroad', 'content', 'codex', `${id}.md`);
    const text = readFileSync(file, 'utf8');
    return new Response(text, { headers: { 'content-type': 'text/plain' } });
  } catch (e) {
    return new Response('not found', { status: 404 });
  }
}
