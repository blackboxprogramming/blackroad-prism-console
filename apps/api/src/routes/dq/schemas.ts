import { Router } from 'express';
import fs from 'fs';
const r = Router();
const IDX='dq/schemas/index.json';
const DIR='dq/schemas/versions';
const idx=()=> fs.existsSync(IDX)? JSON.parse(fs.readFileSync(IDX,'utf-8')) : { schemas:{} };
const write=(o:any)=> { fs.mkdirSync('dq/schemas',{recursive:true}); fs.writeFileSync(IDX, JSON.stringify(o,null,2)); };

r.post('/schemas/upsert',(req,res)=>{
  const { name, version, json } = req.body||{};
  const o=idx(); o.schemas[name] ||= { latest:null, versions:[] };
  const v = version || `v${(o.schemas[name].versions?.length||0)+1}`;
  fs.mkdirSync(DIR,{recursive:true});
  fs.writeFileSync(`${DIR}/${name}@${v}.json`, JSON.stringify(json||{},null,2));
  o.schemas[name].versions = Array.from(new Set([...(o.schemas[name].versions||[]), v]));
  o.schemas[name].latest = v;
  write(o); res.json({ ok:true, name, version: v });
});

r.get('/schemas/:name',(req,res)=>{
  const name=String(req.params.name); const o=idx().schemas[name]; if(!o) return res.status(404).json({error:'not_found'});
  const versions=(o.versions||[]).map((v:string)=>({ version:v, path:`dq/schemas/versions/${name}@${v}.json` }));
  res.json({ name, latest:o.latest, versions });
});

export default r;
