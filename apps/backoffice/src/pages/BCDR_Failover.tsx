import React, { useEffect, useState } from 'react';

export default function BCDR_Failover(){
  const [svc,setSvc]=useState('api'); const [from,setFrom]=useState('us-east'); const [to,setTo]=useState('us-west');
  const run=async()=>{ await fetch('/api/bcdr/failover/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({service:svc,region_from:from,region_to:to,type:'planned'})}); await status(); };
  const status=async()=>{ const j=await (await fetch(`/api/bcdr/failover/status?service=${svc}`)).json(); alert(JSON.stringify(j)); };
  useEffect(()=>{},[]);
  return <section><h2>Failover</h2>
    <div><input value={svc} onChange={e=>setSvc(e.target.value)}/><input value={from} onChange={e=>setFrom(e.target.value)} style={{marginLeft:8}}/><input value={to} onChange={e=>setTo(e.target.value)} style={{marginLeft:8}}/><button onClick={run} style={{marginLeft:8}}>Run</button><button onClick={status} style={{marginLeft:8}}>Status</button></div>
  </section>;
}
