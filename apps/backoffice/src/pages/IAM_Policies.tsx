import React, { useEffect, useState } from 'react';

export default function IAM_Policies(){
  const [pol,setPol]=useState('{"version":"v1","roles":[{"name":"admin","permissions":["read:*","write:*"]},{"name":"viewer","permissions":["read:*"]}],"rules":[{"effect":"allow","action":"read","resource":"secrets","condition":{"attr":"dept","equals":"SEC"}},{"effect":"deny","action":"write","resource":"secrets"}]}');
  const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/iam/policies/set',{method:'POST',headers:{'Content-Type':'application/json'},body:pol}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/iam/policies')).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>RBAC/ABAC Policies</h2>
    <textarea value={pol} onChange={e=>setPol(e.target.value)} style={{width:'100%',height:200}}/>
    <div><button onClick={save}>Save</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
