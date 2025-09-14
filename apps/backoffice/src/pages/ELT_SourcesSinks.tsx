import React, { useEffect, useState } from 'react';

export default function ELT_SourcesSinks(){
  const [src,setSrc]=useState({key:'crm_jdbc',type:'jdbc',config:{url:'jdbc:postgresql://crm',user:'u',pwd:'<REPLACE_ME>'}});
  const [snk,setSnk]=useState({key:'lake_delta',type:'delta',config:{path:'s3://lakehouse'}});
  const [sources,setSources]=useState<any>({}); const [sinks,setSinks]=useState<any>({});
  const upsertSrc=async()=>{ await fetch('/api/elt/sources/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(src)}); await load(); };
  const upsertSnk=async()=>{ await fetch('/api/elt/sinks/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(snk)}); await load(); };
  const load=async()=>{ const s=await (await fetch('/api/elt/sources/list')).json(); const k=await (await fetch('/api/elt/sinks/list')).json(); setSources(s); setSinks(k); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Sources & Sinks</h2>
    <div><input value={src.key} onChange={e=>setSrc({...src,key:e.target.value})}/><input value={src.type} onChange={e=>setSrc({...src,type:e.target.value})} style={{marginLeft:8}}/><button onClick={upsertSrc} style={{marginLeft:8}}>Upsert Source</button></div>
    <div style={{marginTop:8}}><input value={snk.key} onChange={e=>setSnk({...snk,key:e.target.value})}/><input value={snk.type} onChange={e=>setSnk({...snk,type:e.target.value})} style={{marginLeft:8}}/><button onClick={upsertSnk} style={{marginLeft:8}}>Upsert Sink</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify({sources,sinks},null,2)}</pre>
  </section>;
}
