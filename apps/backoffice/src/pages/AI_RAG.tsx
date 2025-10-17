import React, { useEffect, useState } from 'react';

export default function AI_RAG(){
  const [key,setKey]=useState('kb'); const [sources,setSources]=useState('[{"type":"md","path":"docs/README.md"}]'); const [view,setView]=useState<any>(null);
  const upsert=async()=>{ await fetch('/api/ai/rag/pack/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,sources:JSON.parse(sources),chunkSize:800})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/ai/rag/pack/${key}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>RAG Packs</h2>
    <div><input value={key} onChange={e=>setKey(e.target.value)} /><button onClick={upsert} style={{marginLeft:8}}>Upsert</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <textarea value={sources} onChange={e=>setSources(e.target.value)} style={{width:'100%',height:120,marginTop:8}}/>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
