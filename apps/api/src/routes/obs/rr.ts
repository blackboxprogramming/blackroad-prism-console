import { Router } from 'express';
import fs from 'fs';
const r = Router(); const INC='data/obs/incidents.jsonl', OUT='data/obs/rr.jsonl';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/obs',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
r.post('/incidents/ingest',(req,res)=>{ const rows=req.body?.rows||[]; rows.forEach((x:any)=>append(INC,{ ts:Date.now(), ...x })); res.json({ ok:true, count: rows.length }); });
r.post('/rr/analyze',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const rows=lines(INC).filter((x:any)=>String(x.start||'').slice(0,7)===period || String(x.end||'').slice(0,7)===period);
  const perService:Record<string,{count:number,mttr:number,totalDowntime:number,lastStart?:number}>= {};
  for(const i of rows){
    const s=i.service||'unknown'; const start=new Date(i.start).getTime(); const end=i.end?new Date(i.end).getTime():Date.now();
    const dt=Math.max(0,end-start);
    const o=perService[s]||{count:0,mttr:0,totalDowntime:0}; o.count++; o.totalDowntime+=dt; perService[s]=o;
  }
  Object.values(perService).forEach((v:any)=>{ v.mttr = v.count? Math.round(v.totalDowntime/v.count/1000) : 0; v.totalDowntime = Math.round(v.totalDowntime/1000); });
  const row={ ts:Date.now(), period, services: perService };
  append(OUT,row); res.json({ ok:true, snapshot: row });
});
r.get('/rr/recent',(req,res)=>{ const p=String(req.query.period||''); const items=lines(OUT).filter((x:any)=>!p||x.period===p).slice(-1); res.json(items[0]||{}); });
export default r;
