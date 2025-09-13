import React, { useEffect, useState } from 'react';

export default function AI_Tools(){
  const [name,setName]=useState('search'); const [json,setJson]=useState('{"type":"http","endpoint":"https://example.com"}'); const [list,setList]=useState<any>({});
  const upsert=async()=>{ await fetch('/api/ai/tools/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,json:JSON.parse(json)})}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/ai/tools/list')).json(); setList(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Tools Catalog</h2>
    <div><input value={name} onChange={e=>setName(e.target.value)} /><button onClick={upsert} style={{marginLeft:8}}>Upsert</button></div>
    <textarea value={json} onChange={e=>setJson(e.target.value)} style={{width:'100%',height:140,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(list,null,2)}</pre>
  </section>;
}
