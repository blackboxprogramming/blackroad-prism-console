import React, { useEffect, useState } from 'react';

export default function Segments(){
  const [list,setList]=useState<any>({});
  const [yaml,setYaml]=useState('segments:\n  sample:\n    where:\n      any: true');
  const [key,setKey]=useState('sample'); const [name,setName]=useState('Sample');
  const load=async()=>{ const j=await (await fetch('/api/mkt/segments/list')).json(); setList(j); };
  const upsert=async()=>{ await fetch('/api/mkt/segments/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,name,yaml})}); await load(); };
  const compute=async()=>{ await fetch('/api/mkt/segments/compute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key})}); alert('computed'); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Segments</h2>
    <div><input value={key} onChange={e=>setKey(e.target.value)} /><input value={name} onChange={e=>setName(e.target.value)} style={{marginLeft:8}}/><button onClick={upsert} style={{marginLeft:8}}>Upsert</button><button onClick={compute} style={{marginLeft:8}}>Compute</button></div>
    <textarea value={yaml} onChange={e=>setYaml(e.target.value)} style={{width:'100%',height:160,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(list,null,2)}</pre>
  </section>;
}
