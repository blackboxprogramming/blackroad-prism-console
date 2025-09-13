import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

export async function onRequest({ params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const file = path.join(process.cwd(), 'sites', 'blackroad', 'content', 'codex', `${id}.md`);
    const raw = await fs.readFile(file, 'utf8');
    const { content } = matter(raw);
    const html = marked.parse(content);
    const text = html
      .replace(/<[^>]+>/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return new Response(text, {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 's-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return new Response('Prompt not found', { status: 404 });
  }
}
