import { Router } from 'express';
import fs from 'fs';
const r = Router(); const R='wfm/overtime_rules.json', C='data/wfm/clock.jsonl', O='data/wfm/overtime.jsonl', TS='data/wfm/timesheets.jsonl', PE='data/wfm/payroll_exports.jsonl';
const rread=()=> fs.existsSync(R)? JSON.parse(fs.readFileSync(R,'utf-8')):{ rules:{weekly_threshold:Number(process.env.WFM_WEEKLY_HOURS||40),ot_multiplier:Number(process.env.WFM_OT_MULTIPLIER||1.5)} };
const rwrite=(o:any)=>{ fs.mkdirSync('wfm',{recursive:true}); fs.writeFileSync(R, JSON.stringify(o,null,2)); };
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const append=(p:string,row:any)=>{ fs.mkdirSync('data/wfm',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };

r.post('/overtime/rules/set',(req,res)=>{ rwrite({ rules: Object.assign(rread().rules, req.body?.rules||{}) }); res.json({ ok:true }); });

r.post('/overtime/calc',(req,res)=>{
  const { subjectId, period } = req.body||{};
  const punches=lines(C).filter((x:any)=> (!subjectId||x.subjectId===subjectId) && String(new Date(x.ts).toISOString().slice(0,7))===period );
  // naive: each 'in' followed by 'out' forms a pair; compute weekly buckets by ISO week
  function weekStr(d:Date){ const date = new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())); const dayNum=(date.getUTCDay()+6)%7; date.setUTCDate(date.getUTCDate()-dayNum+3); const firstThu=new Date(Date.UTC(date.getUTCFullYear(),0,4)); const week=1+Math.round(((date.getTime()-firstThu.getTime())/86400000-3+(firstThu.getUTCDay()+6)%7)/7); return `${date.getUTCFullYear()}-W${String(week).padStart(2,'0')}`; }
  const pairs: {start:number,end:number,subjectId:string}[]=[]; const stack:Record<string,number>={};
  punches.sort((a:any,b:any)=>a.ts-b.ts).forEach((p:any)=>{ if(p.type==='in'){ stack[p.subjectId]=p.ts; } else if(p.type==='out' && stack[p.subjectId]){ pairs.push({start:stack[p.subjectId],end:p.ts,subjectId:p.subjectId}); delete stack[p.subjectId]; } });
  const weekly:Record<string,number>={};
  pairs.forEach(pr=>{ const hrs=(pr.end-pr.start)/3600000; const wk=weekStr(new Date(pr.end)); weekly[wk]=(weekly[wk]||0)+hrs; });
  const th=Number(rread().rules.weekly_threshold||40); const ot:any=Object.entries(weekly).map(([w,h]:any)=>({week:w,hours:h,ot: Math.max(0,h-th)}));
  const row={ ts:Date.now(), subjectId: subjectId||null, period, summary: ot }; append(O,row); res.json({ ok:true, summary: ot });
});

r.post('/payroll/export',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const dir=process.env.PAYROLL_EXPORT_PATH||'payroll/exports'; fs.mkdirSync(dir,{recursive:true});
  const path=`${dir}/wfm_${period.replace('-','')}.csv`;
  const linesOut=lines(TS).filter((x:any)=>x.period===period).map((x:any)=>`${x.subjectId},${x.period},${(x.lines||[]).reduce((s:number,l:any)=>s+Number(l.hours||0),0)}`);
  fs.writeFileSync(path, `subject,period,hours\n${linesOut.join('\n')}\n`);
  append(PE,{ ts:Date.now(), period, file:path, count: linesOut.length });
  res.json({ ok:true, file: path, count: linesOut.length });
});

r.get('/payroll/recent',(_req,res)=>{ const items=lines(PE).reverse().slice(0,20); res.json({ items }); });

export default r;
