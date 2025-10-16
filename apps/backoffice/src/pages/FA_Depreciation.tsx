import React, { useEffect, useState } from 'react';

export default function FA_Depreciation(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7)); const [view,setView]=useState<any>(null);
  const run=async()=>{ const j=await (await fetch('/api/fa/depr/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period})})).json(); setView(j); };
  const recent=async()=>{ const j=await (await fetch(`/api/fa/depr/recent?period=${period}`)).json(); setView(j); };
  useEffect(()=>{ recent(); },[]);
  return <section><h2>Depreciation</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><button onClick={run} style={{marginLeft:8}}>Run</button><button onClick={recent} style={{marginLeft:8}}>Recent</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
