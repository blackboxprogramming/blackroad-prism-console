import { Router } from 'express';
import fs from 'fs';
const PATH='apps/api/webhooks_registry.json';
const r = Router();
function load(){ return fs.existsSync(PATH)? JSON.parse(fs.readFileSync(PATH,'utf-8')):[]; }
function save(v:any){ fs.mkdirSync('apps/api',{recursive:true}); fs.writeFileSync(PATH, JSON.stringify(v,null,2)); }
r.post('/register', (req,res)=>{ const { partner, url, events } = req.body||{}; const all=load(); all.push({ partner, url, events: events||[] }); save(all); res.json({ ok:true }); });
r.get('/list', (_req,res)=> res.json(load()));
export default r;
