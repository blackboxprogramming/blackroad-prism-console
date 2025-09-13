import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';
import path from 'node:path';

function readShaFile(p: string){
  if(!fs.existsSync(p)) return [] as { hash: string; file: string }[];
  const raw = fs.readFileSync(p,'utf8').trim().split('\n');
  return raw.map(line => {
    // Format: <sha>  <path>
    const [hash, ...rest] = line.split(/\s+/);
    const file = rest.join(' ').trim();
    return { hash, file };
  }).filter(x=>x.hash && x.file);
}

export default function handler(req: NextApiRequest, res: NextApiResponse){
  const shaPath = path.join(process.cwd(), 'public', 'artifacts.sha256');
  const rows = readShaFile(shaPath);
  res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=600');
  res.status(200).json({ generated: new Date().toISOString(), count: rows.length, entries: rows });
}
