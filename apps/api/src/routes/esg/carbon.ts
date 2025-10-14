import { Router } from 'express';
import fs from 'fs';
import yaml from 'yaml';
const r = Router();
const ACT='data/esg/activity.jsonl', EMI='data/esg/emissions.jsonl';
function readAct(){ if(!fs.existsSync(ACT))return[]; return fs.readFileSync(ACT,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); }
function appendEmi(row:any){ fs.mkdirSync('data/esg',{recursive:true}); fs.appendFileSync(EMI, JSON.stringify(row)+'\n'); }
function factors(){
  const p=`esg/factors/${process.env.ESG_DEFAULT_FACTOR_SET||'default'}.yaml`;
  return fs.existsSync(p) ? yaml.parse(fs.readFileSync(p,'utf-8')) : { factors:{ electricity_kwh: 0.0004, diesel_l: 2.68, flight_km: 0.00015 } };
}
r.post('/carbon/calc',(req,res)=>{
  const period=String(req.body?.period||'');
  const f=factors().factors||{};
  const data=readAct().filter((a:any)=>!period||a.period===period);
  const sum=(scope:string)=> data.filter((a:any)=>a.scope===scope).reduce((s:number,a:any)=> s + (a.amount* (f[a.type]||0)), 0);
  const s1=sum('S1'), s2=sum('S2'), s3=sum('S3'); const total=s1+s2+s3;
  const snap={ ts:Date.now(), period, scope1:s1, scope2:s2, scope3:s3, total };
  appendEmi(snap); res.json({ ok:true, snapshot: snap });
});
r.get('/carbon/snapshot',(req,res)=>{
  const p=String(req.query.period||''); if(!fs.existsSync(EMI)) return res.json({ snapshots: [] });
  const rows=fs.readFileSync(EMI,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>!p||x.period===p).slice(-12);
  res.json({ snapshots: rows });
});
export default r;
