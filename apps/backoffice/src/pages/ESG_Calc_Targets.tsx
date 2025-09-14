import React, { useEffect, useState } from 'react';

export default function ESG_Calc_Targets(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7)); const [snap,setSnap]=useState<any>({});
  const [targets,setTargets]=useState('{"targets":[{"scope":"total","baseline_year":2023,"baseline_tCO2e":1000,"target_year":2030,"target_reduction_pct":50}]}'); const [tview,setT]=useState<any>({});
  const run=async()=>{ const j=await (await fetch('/api/esg/calc/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period,factor_source:"DEFRA_2024"})})).json(); setSnap(j.snapshot||j); };
  const load=async()=>{ const j=await (await fetch(`/api/esg/calc/snapshot?period=${period}`)).json(); setSnap(j); };
  const saveT=async()=>{ await fetch('/api/esg/targets/set',{method:'POST',headers:{'Content-Type':'application/json'},body:targets}); const tv=await (await fetch('/api/esg/targets')).json(); setT(tv); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>ESG: Calc & Targets</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><button onClick={run} style={{marginLeft:8}}>Run Calc</button><button onClick={load} style={{marginLeft:8}}>Load Snapshot</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(snap,null,2)}</pre>
    <textarea value={targets} onChange={e=>setTargets(e.target.value)} style={{width:'100%',height:120,marginTop:8}}/><div><button onClick={saveT}>Save Targets</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(tview,null,2)}</pre>
  </section>;
}
