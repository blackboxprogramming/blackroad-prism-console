import React, { useState } from 'react';

export default function DQ_SLA(){
  const [dataset,setDataset]=useState('finance_arr'); const [freshmin,setFreshmin]=useState(60); const [rows,setRows]=useState(0); const [owner,setOwner]=useState('data@blackroad.io'); const [view,setView]=useState<any>(null);
  const upsert=async()=>{ await fetch('/api/dq/sla/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dataset,freshness_min:freshmin,min_rows:rows,owner})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/dq/sla/${dataset}`)).json(); setView(j); };
  const evalSla=async()=>{ const j=await (await fetch('/api/dq/sla/evaluate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dataset})})).json(); alert(JSON.stringify(j)); };
  return <section><h2>Data SLA</h2>
    <div><input value={dataset} onChange={e=>setDataset(e.target.value)}/><input type="number" value={freshmin} onChange={e=>setFreshmin(Number(e.target.value))} style={{marginLeft:8}}/><input type="number" value={rows} onChange={e=>setRows(Number(e.target.value))} style={{marginLeft:8}}/><input value={owner} onChange={e=>setOwner(e.target.value)} style={{marginLeft:8}}/>
      <button onClick={upsert} style={{marginLeft:8}}>Save</button><button onClick={load} style={{marginLeft:8}}>Load</button><button onClick={evalSla} style={{marginLeft:8}}>Evaluate</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
