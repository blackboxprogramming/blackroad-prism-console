import React, { useEffect, useState } from 'react';

export default function DQ_Runs(){
  const [dataset,setDataset]=useState('finance_arr'); const [view,setView]=useState<any>(null);
  const runChecks=async()=>{ await fetch('/api/dq/run/checks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dataset})}); await load(); };
  const runAnom=async()=>{ await fetch('/api/dq/run/anomaly',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dataset})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/dq/run/recent?dataset=${encodeURIComponent(dataset)}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>DQ Runs</h2>
    <div><input value={dataset} onChange={e=>setDataset(e.target.value)}/><button onClick={runChecks} style={{marginLeft:8}}>Run Checks</button><button onClick={runAnom} style={{marginLeft:8}}>Run Anomaly</button><button onClick={load} style={{marginLeft:8}}>Refresh</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
