import { Router } from 'express';
import fs from 'fs';
const r = Router(); const RULES='sox/sod/rules.json', FIND='data/sox/sod/findings.jsonl';
const read=()=> fs.existsSync(RULES)? JSON.parse(fs.readFileSync(RULES,'utf-8')):{ rules:[] };
const write=(o:any)=>{ fs.mkdirSync('sox/sod',{recursive:true}); fs.writeFileSync(RULES, JSON.stringify(o,null,2)); };
const append=(row:any)=>{ fs.mkdirSync('data/sox/sod',{recursive:true}); fs.appendFileSync(FIND, JSON.stringify(row)+'\n'); };

r.post('/sod/rules/upsert',(req,res)=>{ const o=read(); const i=o.rules.findIndex((x:any)=>x.ruleId===req.body?.ruleId); if(i>=0)o.rules[i]=req.body; else o.rules.push(req.body); write(o); res.json({ ok:true }); });

r.post('/sod/scan',(req,res)=>{
  const rules=read().rules||[]; const sys=String(req.body?.system||''); const users=req.body?.users||[];
  const findings:any[]=[];
  for(const u of users){
    const set=new Set(u.roles||[]);
    for(const r of rules){
      for(const pair of r.toxic_pairs||[]){
        if(set.has(pair.roleA) && set.has(pair.roleB)){ findings.push({ system:sys, user:u.id, ruleId:r.ruleId, pair }); }
      }
    }
  }
  findings.forEach(f=>append({ ts:Date.now(), ...f })); res.json({ ok:true, findings });
});

r.get('/sod/rules',(_req,res)=>{ res.json(read()); });

export default r;
