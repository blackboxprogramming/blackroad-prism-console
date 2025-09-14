import React, { useEffect, useState } from 'react';

export default function CPM_Forecasts(){
  const [id,setId]=useState('fin-forecast'); const [view,setView]=useState<any>(null);
  const config=async()=>{ await fetch('/api/cpm/forecast/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,horizon_months:12,unit:'USD',drivers:['finance']})}); };
  const run=async()=>{ await fetch('/api/cpm/forecast/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/cpm/forecast/snapshot?id=${id}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Forecasts</h2>
    <div><input value={id} onChange={e=>setId(e.target.value)}/><button onClick={config} style={{marginLeft:8}}>Config</button><button onClick={run} style={{marginLeft:8}}>Run</button><button onClick={load} style={{marginLeft:8}}>Refresh</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
