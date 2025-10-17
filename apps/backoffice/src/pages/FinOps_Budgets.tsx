import React, { useEffect, useState } from 'react';

export default function FinOps_Budgets(){
  const [form,setForm]=useState('{"scope":"project","key":"core","period":"'+new Date().toISOString().slice(0,7)+'","amount":1000}');
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7));
  const save=async()=>{ await fetch('/api/finops/budgets/set',{method:'POST',headers:{'Content-Type':'application/json'},body:form}); };
  const evalB=async()=>{ const j=await (await fetch('/api/finops/budgets/evaluate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period})})).json(); alert(JSON.stringify(j)); };
  const anomalies=async()=>{ const j=await (await fetch('/api/finops/anomaly/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period})})).json(); alert(JSON.stringify(j)); };
  useEffect(()=>{},[]);
  return <section><h2>Budgets & Anomalies</h2>
    <textarea value={form} onChange={e=>setForm(e.target.value)} style={{width:'100%',height:120}}/><div><button onClick={save}>Save Budget</button><input value={period} onChange={e=>setPeriod(e.target.value)} style={{marginLeft:8}}/><button onClick={evalB} style={{marginLeft:8}}>Evaluate</button><button onClick={anomalies} style={{marginLeft:8}}>Run Anomaly</button></div>
  </section>;
}
