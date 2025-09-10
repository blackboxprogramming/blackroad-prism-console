#!/usr/bin/env node
/* global fetch */
const fs = require('fs');
const path = require('path');
const cfgPath = path.join(__dirname, '../config/llm.json');
async function main() {
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const base = process.env.API_BASE || 'http://127.0.0.1:4000';
  const r = await fetch(`${base}/api/llm/status`);
  if (!r.ok) throw new Error(`status ${r.status}`);
  const st = await r.json();
  if (st.model !== cfg.model) throw new Error('model mismatch');
  if (!st.up) throw new Error('bridge down');
  if (cfg.min_tokens_per_sec && st.tokens_per_sec < cfg.min_tokens_per_sec) {
    throw new Error('tokens_per_sec below minimum');
  }
  console.log('llm ready');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
