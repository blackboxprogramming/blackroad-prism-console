import React, { useEffect, useState } from 'react';

export default function CS_Health(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7)); const [accountId,setAccountId]=useState('A-1'); const [snap,setSnap]=useState<any>({});
  const calc=async()=>{ await fetch('/api/cs/health/calc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period})}); await view(); };
  const view=async()=>{ const j=await (await fetch(`/api/cs/health/snapshot?accountId=${accountId}&period=${period}`)).json(); setSnap(j); };
  useEffect(()=>{ view(); },[]);
  return <section><h2>Health Scores</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><input value={accountId} onChange={e=>setAccountId(e.target.value)} style={{marginLeft:8}}/><button onClick={calc} style={{marginLeft:8}}>Calc</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(snap,null,2)}</pre>
  </section>;
}
