import React, { useState } from 'react';

export default function RevRec_Journal(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7));
  const run=async()=>{ const j=await (await fetch('/api/revrec/journal/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period})})).json(); alert(JSON.stringify(j)); };
  const view=async()=>{ const j=await (await fetch(`/api/revrec/journal/recent?period=${period}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>Journalization</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><button onClick={run} style={{marginLeft:8}}>Run</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
  </section>;
}
