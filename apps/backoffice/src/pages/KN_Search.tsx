import React, { useEffect, useState } from 'react';

export default function KN_Search(){
  const [q,setQ]=useState('agreement'); const [space,setSpace]=useState('default'); const [label,setLabel]=useState(''); const [hits,setHits]=useState<any>({});
  const search=async()=>{ const j=await (await fetch(`/api/kn/search?q=${encodeURIComponent(q)}&space=${space}&k=10&label=${encodeURIComponent(label)}`)).json(); setHits(j); };
  useEffect(()=>{ search(); },[]);
  return <section><h2>Search</h2>
    <div><input value={q} onChange={e=>setQ(e.target.value)}/><input value={space} onChange={e=>setSpace(e.target.value)} style={{marginLeft:8}}/><input placeholder="label key" value={label} onChange={e=>setLabel(e.target.value)} style={{marginLeft:8}}/><button onClick={search} style={{marginLeft:8}}>Search</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(hits,null,2)}</pre>
  </section>;
}
