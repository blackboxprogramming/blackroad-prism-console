import React, { useEffect, useState } from 'react';

export default function WFM_Leave_Accruals(){
  const [policy,setPolicy]=useState({id:'PTO',name:'PTO Standard',period:'monthly',accrual_hours:10,carryover_cap:40});
  const [req,setReq]=useState({requestId:'LR-1',subjectId:'u1',policyId:'PTO',start:'2025-09-25',end:'2025-09-26',hours:16,reason:'Trip',status:'pending'});
  const [approve,setApprove]=useState({requestId:'LR-1',approverId:'mgr1',status:'approved'});
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7)); const [status,setStatus]=useState<any>({});
  const savePol=async()=>{ await fetch('/api/wfm/leave/policies/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(policy)}); };
  const request=async()=>{ await fetch('/api/wfm/leave/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(req)}); };
  const approveReq=async()=>{ await fetch('/api/wfm/leave/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(approve)}); };
  const runAccr=async()=>{ await fetch('/api/wfm/leave/accruals/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period})}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/wfm/leave/status?subjectId=u1')).json(); setStatus(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Leave & Accruals</h2>
    <div><button onClick={savePol}>Save Policy</button><button onClick={request} style={{marginLeft:8}}>Request Leave</button><button onClick={approveReq} style={{marginLeft:8}}>Approve</button><button onClick={runAccr} style={{marginLeft:8}}>Run Accruals</button></div>
    <textarea value={JSON.stringify(policy,null,2)} onChange={e=>setPolicy(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(req,null,2)} onChange={e=>setReq(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <div style={{marginTop:8}}>Period: <input value={period} onChange={e=>setPeriod(e.target.value)}/></div>
    <h4 style={{marginTop:8}}>Status</h4><pre style={{background:'#f7f7f7',padding:8}}>{JSON.stringify(status,null,2)}</pre>
  </section>;
}
