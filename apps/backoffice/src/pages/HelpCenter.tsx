import React, { useEffect, useState } from 'react';

export default function HelpCenter(){
  const [q,setQ]=useState(''); const [hits,setHits]=useState<any[]>([]);
  const [slug,setSlug]=useState('welcome'); const [title,setTitle]=useState('Welcome'); const [md,setMd]=useState('# Welcome');
  const search=async()=>{ const j=await (await fetch(`/api/support/kb/search?q=${encodeURIComponent(q)}`)).json(); setHits(j.hits||[]); };
  const publish=async()=>{ await fetch('/api/support/kb/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,title,md})}); await search(); };
  useEffect(()=>{ search(); },[]);
  return <section><h2>Help Center</h2>
    <div><input placeholder="Search KB…" value={q} onChange={e=>setQ(e.target.value)}/><button onClick={search} style={{marginLeft:8}}>Search</button></div>
    <ul style={{marginTop:8}}>{hits.map((h:any)=><li key={h.slug}>{h.title} <code>{h.slug}</code></li>)}</ul>
    <h3 style={{marginTop:16}}>Publish Article</h3>
    <div><input placeholder="slug" value={slug} onChange={e=>setSlug(e.target.value)}/><input placeholder="title" value={title} onChange={e=>setTitle(e.target.value)} style={{marginLeft:8}}/></div>
    <textarea value={md} onChange={e=>setMd(e.target.value)} style={{width:'100%',height:200,marginTop:8}}/>
    <div><button onClick={publish} style={{marginTop:8}}>Publish</button></div>
  </section>;
}
