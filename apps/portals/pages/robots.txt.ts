import type { NextApiRequest, NextApiResponse } from 'next';
export default function handler(_: NextApiRequest, res: NextApiResponse){
  res.setHeader('Content-Type','text/plain');
  res.send(`User-agent: *\nAllow: /codex/\nAllow: /artifacts\nDisallow: /api/\nSitemap: https://blackroadinc.us/sitemap.xml\n`);
}
