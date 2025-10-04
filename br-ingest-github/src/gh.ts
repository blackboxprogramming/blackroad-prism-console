import fetch from 'node-fetch';
import { sleep, parseLinkNext } from './util.js';

export type Issue = any;

export async function *iterIssues(repo: string, sinceISO: string, token: string) {
  let url = new URL(`https://api.github.com/repos/${repo}/issues`);
  url.searchParams.set('state','all');
  url.searchParams.set('since', sinceISO);
  url.searchParams.set('per_page','100');
  url.searchParams.set('sort','updated');
  url.searchParams.set('direction','asc');

  while (url) {
    const r = await fetch(url, { headers: { Authorization: `token ${token}`, 'User-Agent': 'BlackRoad' } });
    if (r.status === 403 && r.headers.get('x-ratelimit-remaining') === '0') {
      const reset = Number(r.headers.get('x-ratelimit-reset') || 0) * 1000;
      const wait = Math.max(0, reset - Date.now()) + 1000;
      await sleep(wait);
      continue;
    }
    if (!r.ok) throw new Error(`GitHub ${r.status}`);
    const items = await r.json() as Issue[];
    yield items;
    const next = parseLinkNext(r.headers.get('link'));
    url = next ? new URL(next) : (null as any);
  }
}
