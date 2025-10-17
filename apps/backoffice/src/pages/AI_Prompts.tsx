import React, { useEffect, useState } from 'react';

export default function AI_Prompts(){
  const [key,setKey]=useState('assistant'); const [content,setContent]=useState('You are helpful.'); const [view,setView]=useState<any>(null);
  const upsert=async()=>{ await fetch('/api/ai/prompts/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,role:'system',content,metadata:{owner:'platform'}})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/ai/prompts/${key}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Prompt Registry</h2>
    <div><input value={key} onChange={e=>setKey(e.target.value)}/><button onClick={upsert} style={{marginLeft:8}}>Upsert</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <textarea value={content} onChange={e=>setContent(e.target.value)} style={{width:'100%',height:160,marginTop:8}}/>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
