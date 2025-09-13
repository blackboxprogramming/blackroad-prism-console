import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

export default async function handler(_: NextApiRequest, res: NextApiResponse){
  const dir = path.join(process.cwd(),'content','codex');
  const files = (await fs.readdir(dir)).filter(f=>f.endsWith('.md'));
  const items: any[] = [];
  for(const f of files){
    const raw = await fs.readFile(path.join(dir,f),'utf8');
    const { data } = matter(raw);
    items.push(data);
  }
  items.sort((a,b)=> (b.updated||'').localeCompare(a.updated||''));
  const site = 'https://blackroadinc.us';
  const xmlItems = items.map(i => `\n  <item>\n    <title>${escapeXml(i.title)}</title>\n    <link>${site}/codex/${i.slug}</link>\n    <guid isPermaLink="true">${site}/codex/${i.slug}</guid>\n    <pubDate>${new Date(i.updated||Date.now()).toUTCString()}</pubDate>\n    <description>${escapeXml(i.summary||'')}</description>\n  </item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n  <title>Blackroad Codex</title>\n  <link>${site}</link>\n  <description>Codex prompts</description>${xmlItems}\n</channel></rss>`;
  res.setHeader('Content-Type','application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control','s-maxage=600, stale-while-revalidate=3600');
  res.status(200).send(xml);
}

function escapeXml(s: string){
  return String(s).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;','\'':'&apos;'}[c]!));
}
