import React, { useEffect, useState } from 'react';

export default function KN_RAG(){
  const [key,setKey]=useState('pack-1'); const [space,setSpace]=useState('default'); const [query,setQuery]=useState('liability cap'); const [pack,setPack]=useState<any>({});
  const build=async()=>{ await fetch('/api/kn/rag/pack',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,space,query,k:5})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/kn/rag/${key}`)).json(); setPack(j||{}); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>RAG Packs</h2>
    <div><input value={key} onChange={e=>setKey(e.target.value)}/><input value={space} onChange={e=>setSpace(e.target.value)} style={{marginLeft:8}}/><input value={query} onChange={e=>setQuery(e.target.value)} style={{marginLeft:8}}/><button onClick={build} style={{marginLeft:8}}>Build</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(pack,null,2)}</pre>
  </section>;
}
