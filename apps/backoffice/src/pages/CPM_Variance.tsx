import React, { useEffect, useState } from 'react';

export default function CPM_Variance(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7)); const [view,setView]=useState<any>(null);
  const ingest=async()=>{ await fetch('/api/cpm/actuals/ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period,kpis:{ARR:1200000,DAU:5000}})}); };
  const calc=async()=>{ const j=await (await fetch(`/api/cpm/variance?period=${period}`)).json(); setView(j); };
  useEffect(()=>{ calc(); },[]);
  return <section><h2>Variance</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><button onClick={ingest} style={{marginLeft:8}}>Ingest Actuals</button><button onClick={calc} style={{marginLeft:8}}>Calc</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
