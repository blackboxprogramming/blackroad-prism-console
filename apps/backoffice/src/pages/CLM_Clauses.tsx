import React, { useEffect, useState } from 'react';

export default function CLM_Clauses(){
  const [cls,setCls]=useState({id:'confidentiality',title:'Confidentiality',body_md:'Both parties...',tags:['nda','privacy']});
  const [q,setQ]=useState('conf'); const [tag,setTag]=useState(''); const [results,setResults]=useState<any>({});
  const save=async()=>{ await fetch('/api/clm/clauses/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(cls)}); };
  const search=async()=>{ const j=await (await fetch(`/api/clm/clauses/search?q=${encodeURIComponent(q)}&tag=${encodeURIComponent(tag)}`)).json(); setResults(j); };
  useEffect(()=>{ search(); },[]);
  return <section><h2>Clause Library</h2>
    <div><input value={cls.id} onChange={e=>setCls({...cls,id:e.target.value})}/><input value={cls.title} onChange={e=>setCls({...cls,title:e.target.value})} style={{marginLeft:8}}/><button onClick={save} style={{marginLeft:8}}>Save</button></div>
    <textarea value={cls.body_md} onChange={e=>setCls({...cls,body_md:e.target.value})} style={{width:'100%',height:120,marginTop:8}}/>
    <div style={{marginTop:8}}><input placeholder="q" value={q} onChange={e=>setQ(e.target.value)}/><input placeholder="tag" value={tag} onChange={e=>setTag(e.target.value)} style={{marginLeft:8}}/><button onClick={search} style={{marginLeft:8}}>Search</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(results,null,2)}</pre>
  </section>;
}
