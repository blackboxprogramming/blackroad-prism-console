import React, { useState } from 'react';

export default function Leases_Journal(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7));
  const run=async()=>{ const j=await (await fetch('/api/leases/journal/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period})})).json(); alert(JSON.stringify(j)); };
  const recent=async()=>{ const j=await (await fetch(`/api/leases/journal/recent?period=${period}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>Lease Journals</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><button onClick={run} style={{marginLeft:8}}>Run</button><button onClick={recent} style={{marginLeft:8}}>Recent</button></div>
  </section>;
}
