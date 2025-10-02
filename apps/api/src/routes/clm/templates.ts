import { Router } from 'express';
import fs from 'fs';
import path from 'node:path';
import yaml from 'yaml';
import mustache from 'mustache';

const r = Router();
const templatesDir = path.resolve('legal/templates');
function loadClauses(){ return yaml.parse(fs.readFileSync('legal/clauses/library.yaml','utf-8')) || {}; }
function render(tplPath:string, vars:any){
  const tpl = fs.readFileSync(tplPath,'utf-8');
  const ctx = { ...vars, clause: (loadClauses().clauses||{}) };
  return mustache.render(tpl, ctx);
}

r.post('/templates/render', (req,res)=>{
  const { template, variables } = req.body || {};
  if (!template) return res.status(400).json({ error:'template_required' });
  const resolved = path.resolve(templatesDir, `${template}.md`);
  if (!resolved.startsWith(templatesDir + path.sep)) {
    return res.status(400).json({ error:'invalid_template' });
  }
  if (!fs.existsSync(resolved)) return res.status(404).json({ error:'not_found' });
  const out = render(resolved, variables||{});
  res.json({ ok:true, content: out });
});

export default r;
