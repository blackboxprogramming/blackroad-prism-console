import React, { useEffect, useState } from 'react';

export default function SUP_KB(){
  const [art,setArt]=useState({id:'kb-setup',title:'Getting Started',md:'# Start\n...',tags:['getting-started','setup'],visibility:'public'});
  const [q,setQ]=useState('start'); const [tag,setTag]=useState(''); const [results,setResults]=useState<any>({});
  const save=async()=>{ await fetch('/api/support/kb/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(art)}); };
  const search=async()=>{ const j=await (await fetch(`/api/support/kb/search?q=${encodeURIComponent(q)}&tag=${encodeURIComponent(tag)}`)).json(); setResults(j); };
  useEffect(()=>{ search(); },[]);
  return <section><h2>Knowledge Base</h2>
    <div><button onClick={save}>Save Article</button></div>
    <textarea value={JSON.stringify(art,null,2)} onChange={e=>setArt(JSON.parse(e.target.value))} style={{width:'100%',height:140,marginTop:8}}/>
    <div style={{marginTop:8}}><input value={q} onChange={e=>setQ(e.target.value)}/><input placeholder="tag" value={tag} onChange={e=>setTag(e.target.value)} style={{marginLeft:8}}/><button onClick={search} style={{marginLeft:8}}>Search</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(results,null,2)}</pre>
  </section>;
}
