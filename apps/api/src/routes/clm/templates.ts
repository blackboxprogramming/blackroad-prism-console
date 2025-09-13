import { Router } from 'express';
import fs from 'fs';
import yaml from 'yaml';
import mustache from 'mustache';

const r = Router();
function loadClauses(){ return yaml.parse(fs.readFileSync('legal/clauses/library.yaml','utf-8')) || {}; }
function render(tplPath:string, vars:any){
  const tpl = fs.readFileSync(tplPath,'utf-8');
  const ctx = { ...vars, clause: (loadClauses().clauses||{}) };
  return mustache.render(tpl, ctx);
}

r.post('/templates/render', (req,res)=>{
  const { template, variables } = req.body || {};
  if (!template) return res.status(400).json({ error:'template_required' });
  const base = `legal/templates/${template}.md`;
  if (!fs.existsSync(base)) return res.status(404).json({ error:'not_found' });
  const out = render(base, variables||{});
  res.json({ ok:true, content: out });
});

export default r;
