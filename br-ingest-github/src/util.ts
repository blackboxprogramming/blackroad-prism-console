export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
export function parseLinkNext(link: string | null) {
  if (!link) return '';
  const parts = link.split(',').map(s => s.trim());
  for (const p of parts) if (p.endsWith('rel="next"')) return /<([^>]+)>/.exec(p)?.[1] || '';
  return '';
}
