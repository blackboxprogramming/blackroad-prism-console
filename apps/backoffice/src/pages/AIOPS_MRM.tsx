import React, { useEffect, useState } from 'react';

export default function AIOPS_MRM(){
  const [assess,setAssess]=useState('{"modelId":"churn_xgb","version":"1.0.0","risks":["bias","drift"],"controls":["fairness eval","monitoring"],"owner":"ml","approval":"pending"}');
  const [status,setStatus]=useState<any>(null);
  const create=async()=>{ await fetch('/api/aiops/mrm/assessment',{method:'POST',headers:{'Content-Type':'application/json'},body:assess}); };
  const approve=async()=>{ await fetch('/api/aiops/mrm/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({modelId:'churn_xgb',version:'1.0.0',approver:'risk',decision:'approved'})}); };
  const view=async()=>{ const j=await (await fetch('/api/aiops/mrm/status?modelId=churn_xgb&version=1.0.0')).json(); setStatus(j); };
  useEffect(()=>{ view(); },[]);
  return <section><h2>Model Risk Management (MRM)</h2>
    <textarea value={assess} onChange={e=>setAssess(e.target.value)} style={{width:'100%',height:140}}/><div><button onClick={create}>Create Assessment</button><button onClick={approve} style={{marginLeft:8}}>Approve</button><button onClick={view} style={{marginLeft:8}}>Status</button></div>
    {status && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(status,null,2)}</pre>}
  </section>;
}
