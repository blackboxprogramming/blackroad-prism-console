import React, { useState } from 'react';

export default function Payroll_Run(){
  const [run,setRun]=useState({runId:'RUN-1',period_start:'2025-09-01',period_end:'2025-09-15',pay_date:'2025-09-20'});
  const [status,setStatus]=useState<any>(null);
  const create=async()=>{ await fetch('/api/payroll/run/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(run)}); };
  const calc=async()=>{ const j=await (await fetch('/api/payroll/run/calc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(run)})).json(); setStatus(j); };
  const approve=async()=>{ await fetch('/api/payroll/run/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:run.runId,approver:'payroll'})}); };
  const history=async()=>{ const j=await (await fetch(`/api/payroll/run/status/${run.runId}`)).json(); setStatus(j); };
  return <section><h2>Pay Run</h2>
    <div><input value={run.runId} onChange={e=>setRun({...run,runId:e.target.value})}/><input value={run.period_start} onChange={e=>setRun({...run,period_start:e.target.value})} style={{marginLeft:8}}/><input value={run.period_end} onChange={e=>setRun({...run,period_end:e.target.value})} style={{marginLeft:8}}/><input value={run.pay_date} onChange={e=>setRun({...run,pay_date:e.target.value})} style={{marginLeft:8}}/><button onClick={create} style={{marginLeft:8}}>Create</button><button onClick={calc} style={{marginLeft:8}}>Calc</button><button onClick={approve} style={{marginLeft:8}}>Approve</button><button onClick={history} style={{marginLeft:8}}>History</button></div>
    {status && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(status,null,2)}</pre>}
  </section>;
}

