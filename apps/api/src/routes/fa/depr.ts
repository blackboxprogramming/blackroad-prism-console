import { Router } from 'express';
import fs from 'fs';
const r = Router(); const REG='fa/assets.json', RUN='data/fa/depr_runs.jsonl', J='data/fa/depr_journal.jsonl';
const assets=()=> fs.existsSync(REG)? JSON.parse(fs.readFileSync(REG,'utf-8')).assets || {} : {};
const append=(p:string,row:any)=>{ fs.mkdirSync('data/fa',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };

function monthsBetween(start:string,end:string){ const sd=new Date(start), ed=new Date(end); return (ed.getFullYear()-sd.getFullYear())*12 + (ed.getMonth()-sd.getMonth()); }

r.post('/depr/run',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const out:any[]=[];
  for(const id of Object.keys(assets())){
    const a=assets()[id]; if(!a || a.state==='disposed') continue;
    const salvage=Number(a.salvage||0), cost=Number(a.cost||0), base=Math.max(0,cost-salvage), life=Number(a.life_months||1);
    let amt=0;
    if(a.method==='DDB'){ const start=a.acquire_date||period+'-01'; const age=monthsBetween(start, period+'-01')+1; const rate=2/life; const nbv = base * Math.pow(1-rate, Math.max(0,age-1)); amt = Math.max(0, nbv*rate); }
    else if(a.method==='SYD'){ const start=a.acquire_date||period+'-01'; const age=monthsBetween(start, period+'-01')+1; const syd=life*(life+1)/2; amt = base * (life - (age-1)) / syd; }
    else { amt = base / life; }
    amt = Number(amt.toFixed(2));
    out.push({ assetId:id, amount:amt });
    append(J,{ ts:Date.now(), period, assetId:id, je:[{account:process.env.FA_GL_DEPR_EXP||'6100',dr:amt,cr:0},{account:process.env.FA_GL_ACCUM_DEP||'1500',dr:0,cr:amt}] });
  }
  append(RUN,{ ts:Date.now(), period, lines: out });
  res.json({ ok:true, count: out.length });
});

r.get('/depr/recent',(req,res)=>{
  const p=String(req.query.period||''); const rows=fs.existsSync(RUN)?fs.readFileSync(RUN,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>!p||x.period===p).slice(-1):[];
  res.json(rows[0]||{});
});

export default r;
