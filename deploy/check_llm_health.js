#!/usr/bin/env node
/* global fetch, AbortSignal */
const base = process.env.API_BASE || 'http://127.0.0.1:4000';
async function main() {
  const health = await fetch(`${base}/api/llm/health`, { signal: AbortSignal.timeout(3000) });
  if (!health.ok) throw new Error(`health ${health.status}`);
  const hj = await health.json();
  if (!hj.ok) throw new Error('bridge not ok');
  const gen = await fetch(`${base}/api/llm/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: 'ping', max_tokens: 8 })
  });
  if (!gen.ok) throw new Error(`generate ${gen.status}`);
  const txt = await gen.text();
  if (!txt.trim()) throw new Error('empty stream');
  console.log('llm ok');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
