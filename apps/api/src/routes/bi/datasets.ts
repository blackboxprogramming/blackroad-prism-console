import { Router } from 'express';
import fs from 'fs';
import path from 'path';
const r = Router();

const curatedDir = path.resolve('warehouse/data/curated');

function resolveDatasetPath(name: string) {
  const datasetPath = path.resolve(curatedDir, `${name}.json`);
  const relative = path.relative(curatedDir, datasetPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return datasetPath;
}

r.get('/dataset/:name', (req,res)=>{
  const name = String(req.params.name);
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) return res.status(400).json({ error:'invalid_name' });
  const datasetPath = resolveDatasetPath(name);
  if (!datasetPath) return res.status(400).json({ error:'invalid_name' });
  if (!fs.existsSync(datasetPath)) return res.status(404).json({ error:'not_found' });
  res.type('application/json').send(fs.readFileSync(datasetPath,'utf-8'));
});

export default r;
