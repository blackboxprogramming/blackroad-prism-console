import React, { useEffect, useState } from 'react';

export default function Privacy_DPIA(){
  const [form,setForm]=useState('{"dpiaId":"dpia-1","system":"DataLake","risk_level":"med","summary":"analytics processing of pseudonymized data","mitigations":["tokenization","access controls"]}');
  const [id,setId]=useState('dpia-1'); const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/privacy/dpia/create',{method:'POST',headers:{'Content-Type':'application/json'},body:form}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/privacy/dpia/${id}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>DPIA</h2>
    <textarea value={form} onChange={e=>setForm(e.target.value)} style={{width:'100%',height:140}}/><div><button onClick={save}>Save</button><input value={id} onChange={e=>setId(e.target.value)} style={{marginLeft:8}}/><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
