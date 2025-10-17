import { Router } from 'express';
import fs from 'fs';
const r = Router(); const O='okr/objectives.json', K='okr/krs.json', C='data/okr/checkins.jsonl';
const objs=()=> fs.existsSync(O)? JSON.parse(fs.readFileSync(O,'utf-8')).objectives||{}:{};
const krs=()=> fs.existsSync(K)? JSON.parse(fs.readFileSync(K,'utf-8')).krs||{}:{};
const append=(row:any)=>{ fs.mkdirSync('data/okr',{recursive:true}); fs.appendFileSync(C, JSON.stringify(row)+'\n'); };
const recent=()=> fs.existsSync(C)? fs.readFileSync(C,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.post('/checkin',(req,res)=>{ const o=objs()[req.body?.objectiveId]; if(!o) return res.status(404).json({error:'objective_not_found'}); append({ ts:req.body?.ts||Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/summary',(req,res)=>{
  const period=String(req.query.period||''); const rows=recent().filter((x:any)=>!period||x.period===period);
  const byObj:Record<string,any>={}; rows.forEach((r:any)=>{ byObj[r.objectiveId]=byObj[r.objectiveId]||{count:0,score:0}; byObj[r.objectiveId].count++; byObj[r.objectiveId].score+=Number(r.score||0); });
  const summary=Object.entries(byObj).map(([id,v]:any)=>({ objectiveId:id, avg_score: v.count? Number((v.score/v.count).toFixed(2)) : 0, checkins:v.count }));
  res.json({ period, summary });
});
export default r;
