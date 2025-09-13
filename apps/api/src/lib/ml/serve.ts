import fs from 'fs';
import path from 'path';
import NodeCache from 'node-cache';
// Minimal pickle via JSON emulation: expect simple linear model params persisted as JSON alongside pkl
type Model = { kind: 'linear', w: number[], b: number };

const cache = new NodeCache({ stdTTL: 300 });
function loadActive(): Model {
  const active = JSON.parse(fs.readFileSync('ml/registry/active.json','utf-8'));
  const jsonSidecar = 'ml/artifacts/model.json';
  if (fs.existsSync(jsonSidecar)) return JSON.parse(fs.readFileSync(jsonSidecar,'utf-8'));
  // fallback: trivial model
  return { kind:'linear', w:[0], b:0 };
}

export function predict(features: number[]): number {
  const key = 'active-model';
  let model = cache.get<Model>(key);
  if (!model) { model = loadActive(); cache.set(key, model); }
  const dot = model.w.slice(0, features.length).reduce((s,v,i)=>s+v*features[i],0) + model.b;
  const prob = 1/(1+Math.exp(-dot));
  return prob;
}
