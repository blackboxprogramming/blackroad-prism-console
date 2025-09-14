import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FX='cons/fx_rates.json', TRANS='data/cons/translated.jsonl', TB='data/cons/tb.jsonl';
const readFX=()=> fs.existsSync(FX)? JSON.parse(fs.readFileSync(FX,'utf-8')):{ rates:{} };
const writeFX=(o:any)=>{ fs.mkdirSync('cons',{recursive:true}); fs.writeFileSync(FX, JSON.stringify(o,null,2)); };
const readTB=()=> fs.existsSync(TB)? fs.readFileSync(TB,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)) : [];
const appendTrans=(row:any)=>{ fs.mkdirSync('data/cons',{recursive:true}); fs.appendFileSync(TRANS, JSON.stringify(row)+'\n'); };

r.post('/fx/upsert',(req,res)=>{ const cur=readFX(); cur[req.body?.period||'0000-00']=req.body; writeFX(cur); res.json({ ok:true }); });

r.post('/fx/translate',(req,res)=>{
  const period=String(req.body?.period||''); const base=String(req.body?.base||process.env.CONS_BASE_CURRENCY||'USD');
  const fx=readFX()[period]||{rates:{[base]:1}}; const rates=fx.rates||{[base]:1};
  const rows=readTB().filter((x:any)=>x.period===period);
  const out:any[]=[];
  for(const tb of rows){
    const r=rates[tb.currency||base]??1;
    const mapped=(tb.rows||tb.rows||tb.rows); // tolerant
    const total=(tb.rows||[]).reduce((s:number,a:any)=> s + (a.dc==='D'?1:-1)*a.amount/r, 0);
    out.push({ ts:Date.now(), period, entityId: tb.entityId, base, total: Number(total.toFixed(2)) });
  }
  out.forEach(x=>appendTrans(x));
  res.json({ ok:true, count: out.length });
});

export default r;
