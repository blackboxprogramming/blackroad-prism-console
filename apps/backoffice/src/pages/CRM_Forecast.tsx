
import React, { useEffect, useState } from 'react';

export default function CRM_Forecast(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7));
  const [snap,setSnap]=useState<any>({});
  const run=async()=>{ const j=await (await fetch('/api/crm/forecast/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period,model:'best'})})).json(); setSnap(j.snapshot||{}); };
  const view=async()=>{ const j=await (await fetch(`/api/crm/forecast/snapshot?period=${period}`)).json(); setSnap(j); };
  useEffect(()=>{ view(); },[]);
  return <section><h2>Forecast</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><button onClick={run} style={{marginLeft:8}}>Run</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(snap,null,2)}</pre>
  </section>;
}

