import React, { useEffect, useState } from 'react';

export default function DQ_Schemas(){
  const [name,setName]=useState('finance_arr'); const [json,setJson]=useState('{"type":"object","properties":{"metric":{"type":"string"},"value":{"type":"number"},"ts":{"type":"number"}}}');
  const [view,setView]=useState<any>(null);
  const upsert=async()=>{ await fetch('/api/dq/schemas/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,version:"v1",json:JSON.parse(json)})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/dq/schemas/${name}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Schemas</h2>
    <div><input value={name} onChange={e=>setName(e.target.value)}/><button onClick={upsert} style={{marginLeft:8}}>Upsert</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <textarea value={json} onChange={e=>setJson(e.target.value)} style={{width:'100%',height:160,marginTop:8}}/>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
