
import React, { useEffect, useState } from 'react';

export default function DEV_Keys_Plans(){
  const [mintBody,setMintBody]=useState('{"subject":"svc-reporter","scopes":["ledger.read"]}');
  const [plans,setPlans]=useState('{"plans":[{"id":"basic","name":"Basic","rate_limit_rpm":100,"burst":50,"quota_month":10000},{"id":"pro","name":"Pro","rate_limit_rpm":500,"burst":200,"quota_month":200000}]}');
  const [token,setToken]=useState(''); const [assign,setAssign]=useState('{"token":"","plan_id":"pro"}'); const [recent,setRecent]=useState<any>({});
  const mint=async()=>{ const j=await (await fetch('/api/dev/keys/mint',{method:'POST',headers:{'Content-Type':'application/json'},body:mintBody})).json(); setToken(j.token); setAssign(JSON.stringify({...JSON.parse(assign),token:j.token})); await load(); };
  const revoke=async()=>{ await fetch('/api/dev/keys/revoke',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})}); await load(); };
  const savePlans=async()=>{ await fetch('/api/dev/plans/set',{method:'POST',headers:{'Content-Type':'application/json'},body:plans}); };
  const sub=async()=>{ await fetch('/api/dev/subscriptions/assign',{method:'POST',headers:{'Content-Type':'application/json'},body:assign}); };
  const load=async()=>{ const j=await (await fetch('/api/dev/keys/recent')).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Keys, OAuth & Plans</h2>
    <div><textarea value={mintBody} onChange={e=>setMintBody(e.target.value)} style={{width:'100%',height:90}}/><button onClick={mint}>Mint Key</button><button onClick={revoke} style={{marginLeft:8}}>Revoke</button></div>
    <div style={{marginTop:8}}><textarea value={plans} onChange={e=>setPlans(e.target.value)} style={{width:'100%',height:110}}/><button onClick={savePlans}>Save Plans</button></div>
    <div style={{marginTop:8}}><textarea value={assign} onChange={e=>setAssign(e.target.value)} style={{width:'100%',height:90}}/><button onClick={sub}>Assign Plan</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
