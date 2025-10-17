import React, { useEffect, useState } from 'react';

export default function IAM_Secrets(){
  const [put,setPut]=useState('{"key":"db/password","value":"s3cr3t","owner":"secops","rotate_days":90}');
  const [getKey,setGetKey]=useState('db/password'); const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/iam/secrets/put',{method:'POST',headers:{'Content-Type':'application/json'},body:put}); };
  const rotate=async()=>{ const k=JSON.parse(put).key; await fetch('/api/iam/secrets/rotate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:k})}); };
  const get=async()=>{ const j=await (await fetch(`/api/iam/secrets/get?key=${encodeURIComponent(getKey)}`)).json(); setView(j); };
  useEffect(()=>{},[]);
  return <section><h2>Secrets Vault</h2>
    <textarea value={put} onChange={e=>setPut(e.target.value)} style={{width:'100%',height:120}}/><div><button onClick={save}>Put</button><button onClick={rotate} style={{marginLeft:8}}>Rotate</button></div>
    <div style={{marginTop:8}}><input value={getKey} onChange={e=>setGetKey(e.target.value)}/><button onClick={get} style={{marginLeft:8}}>Get</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
