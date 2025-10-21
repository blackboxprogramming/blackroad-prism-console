import React, { useState } from 'react';

export default function PSA_Revenue(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7));
  const run=async()=>{ const j=await (await fetch('/api/psa/rev/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period})})).json(); alert(JSON.stringify(j)); };
  const recent=async()=>{ const j=await (await fetch(`/api/psa/rev/recent?period=${period}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>PSA Revenue</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><button onClick={run} style={{marginLeft:8}}>Run</button><button onClick={recent} style={{marginLeft:8}}>Recent</button></div>
  </section>;
}
