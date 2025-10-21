
import React, { useState } from 'react';

export default function CRM_Renewals(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7));
  const seed=async()=>{ await fetch('/api/crm/renewals/seed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:'manual',period})}); };
  const run=async()=>{ const j=await (await fetch('/api/crm/renewals/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period})})).json(); alert(JSON.stringify(j)); };
  const recent=async()=>{ const j=await (await fetch(`/api/crm/renewals/recent?period=${period}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>Renewals & Churn</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><button onClick={seed} style={{marginLeft:8}}>Seed</button><button onClick={run} style={{marginLeft:8}}>Run</button><button onClick={recent} style={{marginLeft:8}}>Recent</button></div>
  </section>;
}

