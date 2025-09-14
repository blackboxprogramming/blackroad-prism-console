import React, { useState } from 'react';

export default function FinOps_Recommendations(){
  const [provider,setProvider]=useState('aws'); const [period,setPeriod]=useState(new Date().toISOString().slice(0,7));
  const run=async()=>{ await fetch('/api/finops/recs/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider,period})}); };
  const recent=async()=>{ const j=await (await fetch(`/api/finops/recs/recent?provider=${provider}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>RI/SP Recommendations</h2>
    <div><input value={provider} onChange={e=>setProvider(e.target.value)}/><input value={period} onChange={e=>setPeriod(e.target.value)} style={{marginLeft:8}}/><button onClick={run} style={{marginLeft:8}}>Run</button><button onClick={recent} style={{marginLeft:8}}>Recent</button></div>
  </section>;
}
