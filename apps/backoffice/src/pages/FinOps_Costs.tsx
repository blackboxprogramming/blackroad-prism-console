import React, { useEffect, useState } from 'react';

export default function FinOps_Costs(){
  const [provider,setProvider]=useState('aws'); const [period,setPeriod]=useState(new Date().toISOString().slice(0,7));
  const [payload,setPayload]=useState('{"provider":"aws","period":"'+new Date().toISOString().slice(0,7)+'","rows":[{"date":"'+new Date().toISOString().slice(0,10)+'","service":"EC2","resource":"i-123","usage":10,"unit":"hrs","cost":25,"currency":"USD","project":"core","env":"prod","labels":{"owner":"platform"}}]}');
  const ingest=async()=>{ await fetch('/api/finops/ingest/cost',{method:'POST',headers:{'Content-Type':'application/json'},body:payload}); };
  const snapshot=async()=>{ const j=await (await fetch(`/api/finops/cost/snapshot?period=${period}&provider=${provider}`)).json(); alert(JSON.stringify(j)); };
  useEffect(()=>{},[]);
  return <section><h2>FinOps Costs</h2>
    <textarea value={payload} onChange={e=>setPayload(e.target.value)} style={{width:'100%',height:160}}/><div><button onClick={ingest}>Ingest</button><input value={period} onChange={e=>setPeriod(e.target.value)} style={{marginLeft:8}}/><input value={provider} onChange={e=>setProvider(e.target.value)} style={{marginLeft:8}}/><button onClick={snapshot} style={{marginLeft:8}}>Snapshot</button></div>
  </section>;
}
