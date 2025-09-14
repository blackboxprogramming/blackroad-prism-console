import React, { useEffect, useState } from 'react';

export default function AIOPS_Deploy(){
  const [env,setEnv]=useState('prod'); const [model,setModel]=useState('churn_xgb'); const [ver,setVer]=useState('1.0.0'); const [pct,setPct]=useState(10); const [view,setView]=useState<any>({});
  const canary=async()=>{ await fetch('/api/aiops/deploy/canary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({modelId:model,version:ver,percent:pct,env})}); await status(); };
  const promote=async()=>{ await fetch('/api/aiops/deploy/promote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({modelId:model,version:ver,env})}); await status(); };
  const rollback=async()=>{ await fetch('/api/aiops/deploy/rollback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({env})}); await status(); };
  const status=async()=>{ const j=await (await fetch(`/api/aiops/deploy/status?env=${env}`)).json(); setView(j); };
  useEffect(()=>{ status(); },[]);
  return <section><h2>Deploy (Canary/Promote/Rollback)</h2>
    <div><input value={env} onChange={e=>setEnv(e.target.value)}/><input value={model} onChange={e=>setModel(e.target.value)} style={{marginLeft:8}}/><input value={ver} onChange={e=>setVer(e.target.value)} style={{marginLeft:8}}/><input type="number" value={pct} onChange={e=>setPct(Number(e.target.value))} style={{marginLeft:8,width:90}}/><button onClick={canary} style={{marginLeft:8}}>Canary</button><button onClick={promote} style={{marginLeft:8}}>Promote</button><button onClick={rollback} style={{marginLeft:8}}>Rollback</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>
  </section>;
}
