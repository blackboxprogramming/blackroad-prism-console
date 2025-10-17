import { Router } from 'express';
import fs from 'fs';
const r = Router();
const EMP='payroll/employees.json', TIME='data/payroll/time.jsonl', RUN='data/payroll/runs.jsonl', VCH='data/payroll/vouchers.jsonl', GL='data/payroll/gl.jsonl';
const employees=()=> fs.existsSync(EMP)? JSON.parse(fs.readFileSync(EMP,'utf-8')).employees||{}:{};
const readTime=(start:string,end:string)=> fs.existsSync(TIME)? fs.readFileSync(TIME,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((t:any)=>t.date>=start && t.date<=end):[];
const append=(p:string,row:any)=>{ fs.mkdirSync('data/payroll',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };

function calcGross(emp:any, start:string, end:string){
  if((emp.pay_type||'salary')==='salary'){
    // Simple: assume monthly salary=rate; semimonthly proration 0.5 else monthly
    return Number(emp.rate||0);
  } else {
    const rows=readTime(start,end).filter((t:any)=>t.employeeId===emp.id);
    const hours=rows.reduce((s:number,t:any)=>s+Number(t.hours||0),0);
    return Number((hours*(emp.rate||0)).toFixed(2));
  }
}
function calcDeductions(emp:any, gross:number){
  const fed=Number(process.env.PAYROLL_FED_WITHHOLD_RATE||0.18);
  const ss =Number(process.env.PAYROLL_SS_RATE||0.062);
  const med=Number(process.env.PAYROLL_MED_RATE||0.0145);
  const ben=(emp.benefits?.medical||0)+(emp.benefits?.dental||0)+(emp.benefits?.vision||0);
  const taxes = Number((gross*(fed+ss+med)).toFixed(2));
  return { taxes, benefits: Number(ben||0) };
}

r.post('/run/create',(req,res)=>{ append(RUN,{ ts:Date.now(), status:'created', ...req.body }); res.json({ ok:true }); });

r.post('/run/calc',(req,res)=>{
  const { runId, period_start, period_end, pay_date } = req.body||{};
  const lines:any[]=[];
  for(const id of Object.keys(employees())){
    const emp=employees()[id]; if(!emp || (emp.start_date && emp.start_date>period_end)) continue;
    const gross=calcGross(emp, period_start, period_end);
    const ded=calcDeductions(emp, gross);
    const net = Number((gross - ded.taxes - ded.benefits).toFixed(2));
    lines.push({ employeeId:id, gross, taxes:ded.taxes, benefits:ded.benefits, net, currency: emp.currency||'USD' });
    append(VCH,{ ts:Date.now(), runId, employeeId:id, gross, net, pay_date });
  }
  append(RUN,{ ts:Date.now(), runId, period_start, period_end, pay_date, status:'calculated', lines });
  res.json({ ok:true, count: lines.length });
});

r.post('/run/approve',(req,res)=>{ append(RUN,{ ts:Date.now(), runId:req.body?.runId, status:'approved', approver:req.body?.approver }); res.json({ ok:true }); });

r.post('/run/export',(req,res)=>{
  const { runId, mode } = req.body||{};
  // GL export summary
  const rows=fs.existsSync(RUN)? fs.readFileSync(RUN,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>x.runId===runId && x.status==='calculated').slice(-1):[];
  const lines=rows[0]?.lines||[];
  const wages = lines.reduce((s:number,l:any)=>s+Number(l.gross||0),0);
  const taxes = lines.reduce((s:number,l:any)=>s+Number(l.taxes||0),0);
  const ben   = lines.reduce((s:number,l:any)=>s+Number(l.benefits||0),0);
  const cash  = lines.reduce((s:number,l:any)=>s+Number(l.net||0),0);
  const je=[{account:process.env.PAYROLL_GL_WAGES||'6200',dr:wages,cr:0},{account:process.env.PAYROLL_GL_TAX||'2100',dr:0,cr:taxes},{account:process.env.PAYROLL_GL_BEN||'6400',dr:ben,cr:0},{account:process.env.PAYROLL_GL_CASH||'1000',dr:0,cr:cash}];
  append(GL,{ ts:Date.now(), runId, je, mode: mode||'ach' });
  res.json({ ok:true, exported:{ runId, mode }, entries: je.length });
});

r.get('/run/status/:runId',(req,res)=>{
  const rows=fs.existsSync(RUN)? fs.readFileSync(RUN,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>x.runId===String(req.params.runId)).slice(-5):[];
  res.json({ history: rows });
});

export default r;

