import React, { useEffect, useState } from 'react';

export default function ESG_Carbon(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7));
  const [snap,setSnap]=useState<any>({});
  const capture=async()=>{ const type=prompt('activity type (electricity_kwh|diesel_l|flight_km)?')||'electricity_kwh'; const scope=prompt('scope (S1|S2|S3)?','S2')||'S2'; const amount=Number(prompt('amount?','100')||'100'); await fetch('/api/esg/activity/capture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,scope,amount,unit:'auto',source:'manual',period})}); };
  const calc=async()=>{ await fetch('/api/esg/carbon/calc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/esg/carbon/snapshot?period=${period}`)).json(); setSnap(j); };
  useEffect(()=>{ load(); },[period]);
  return <section><h2>Carbon (S1–S3)</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><button onClick={capture} style={{marginLeft:8}}>Capture</button><button onClick={calc} style={{marginLeft:8}}>Calculate</button><button onClick={load} style={{marginLeft:8}}>Refresh</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(snap,null,2)}</pre>
  </section>;
}
