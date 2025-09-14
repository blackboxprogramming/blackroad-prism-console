import React, { useState } from 'react';

export default function CONS_Run(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7)); const [base,setBase]=useState('USD'); const [snap,setSnap]=useState<any>(null);
  const run=async()=>{ const j=await (await fetch('/api/cons/run/consolidate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period,base})})).json(); setSnap(j.snapshot||j); };
  const view=async()=>{ const j=await (await fetch(`/api/cons/run/snapshot?period=${period}`)).json(); setSnap(j); };
  return <section><h2>Consolidation Run</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><input value={base} onChange={e=>setBase(e.target.value)} style={{marginLeft:8}}/><button onClick={run} style={{marginLeft:8}}>Run</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
    {snap && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(snap,null,2)}</pre>}
  </section>;
}
