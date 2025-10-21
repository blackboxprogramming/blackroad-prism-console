import React, { useState } from 'react';

export default function PSA_Billing(){
  const [projectId,setProjectId]=useState('PRJ-1'); const [thru,setThru]=useState(new Date().toISOString().slice(0,10)); const [billingId,setBillingId]=useState('');
  const wip=async()=>{ const j=await (await fetch('/api/psa/wip/calc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId,thru})})).json(); alert(JSON.stringify(j)); };
  const run=async()=>{ const j=await (await fetch('/api/psa/billing/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId,thru})})).json(); setBillingId(j.billing?.billingId||''); };
  const exportAR=async()=>{ if(!billingId) return; const j=await (await fetch('/api/psa/ar/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({billingId})})).json(); alert(JSON.stringify(j)); };
  const recent=async()=>{ const j=await (await fetch(`/api/psa/billing/recent?projectId=${projectId}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>WIP & Billing</h2>
    <div><input value={projectId} onChange={e=>setProjectId(e.target.value)}/><input value={thru} onChange={e=>setThru(e.target.value)} style={{marginLeft:8}}/><button onClick={wip} style={{marginLeft:8}}>Calc WIP</button><button onClick={run} style={{marginLeft:8}}>Run Billing</button><button onClick={exportAR} style={{marginLeft:8}}>Export to AR</button><button onClick={recent} style={{marginLeft:8}}>Recent</button></div>
  </section>;
}
