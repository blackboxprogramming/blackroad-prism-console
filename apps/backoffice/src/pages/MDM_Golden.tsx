import React, { useEffect, useState } from 'react';

export default function MDM_Golden(){
  const [domain,setDomain]=useState('accounts'); const [clusterId,setClusterId]=useState(''); const [golden,setGolden]=useState<any>({});
  const match=async()=>{ await fetch('/api/mdm/match/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({domain})}); };
  const merge=async()=>{ const j=await (await fetch('/api/mdm/merge/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({domain,clusterId,policy:'auto'})})).json(); alert(JSON.stringify(j)); await view(); };
  const view=async()=>{ const j=await (await fetch(`/api/mdm/golden/${domain}`)).json(); setGolden(j); };
  useEffect(()=>{ view(); },[]);
  return <section><h2>Golden Records</h2>
    <div><input value={domain} onChange={e=>setDomain(e.target.value)}/><input placeholder="clusterId (optional)" value={clusterId} onChange={e=>setClusterId(e.target.value)} style={{marginLeft:8}}/><button onClick={match} style={{marginLeft:8}}>Match</button><button onClick={merge} style={{marginLeft:8}}>Merge</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(golden,null,2)}</pre>
  </section>;
}
