import React, { useEffect, useState } from 'react';

export default function KN_Connectors(){
  const [c,setC]=useState({key:'clm',type:'clm',config:{base:'/api/clm'}});
  const [list,setList]=useState<any>({});
  const save=async()=>{ await fetch('/api/kn/connectors/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(c)}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/kn/connectors/list')).json(); setList(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Knowledge Connectors</h2>
    <div><input value={c.key} onChange={e=>setC({...c,key:e.target.value})}/><input value={c.type} onChange={e=>setC({...c,type:e.target.value})} style={{marginLeft:8}}/><button onClick={save} style={{marginLeft:8}}>Upsert</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(list,null,2)}</pre>
  </section>;
}
