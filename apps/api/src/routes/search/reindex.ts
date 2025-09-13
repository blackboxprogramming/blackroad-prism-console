import { Router } from 'express';
import { spawnSync } from 'node:child_process';
const r = Router();
r.post('/', (_req, res) => {
  const out = spawnSync('node', ['scripts/search_index.ts'], { encoding: 'utf-8' });
  res.json({ ok:true, output: out.stdout || '' });
});
export default r;
