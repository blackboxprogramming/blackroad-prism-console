
import React, { useEffect, useState } from 'react';

export default function DEV_APIs(){
  const [api,setApi]=useState({name:'ledger',version:'v1',base_path:'/api/ledger',owner:'platform',visibility:'internal',sla:{p95_ms:300,availability:99.9}});
  const [view,setView]=useState<any>({});
  const save=async()=>{ await fetch('/api/dev/apis/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(api)}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/dev/apis/${api.name}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>API Registry</h2>
    <div><input value={api.name} onChange={e=>setApi({...api,name:e.target.value})}/><input value={api.version} onChange={e=>setApi({...api,version:e.target.value})} style={{marginLeft:8}}/><input value={api.base_path} onChange={e=>setApi({...api,base_path:e.target.value})} style={{marginLeft:8}}/><button onClick={save} style={{marginLeft:8}}>Save</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
