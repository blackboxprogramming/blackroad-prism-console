import React, { useEffect, useState } from 'react';

export default function Privacy_ROPA(){
  const [form,setForm]=useState('{"id":"ropa-1","system":"CRM","purpose":"Customer management","lawful_basis":"Contract","dpo":"dpo@blackroad.io","processors":["VendorA"],"data_categories":["PII"],"subjects":["customers"],"retention":"P3Y"}');
  const [id,setId]=useState('ropa-1'); const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/privacy/ropa/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:form}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/privacy/ropa/${id}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>ROPA</h2>
    <textarea value={form} onChange={e=>setForm(e.target.value)} style={{width:'100%',height:160}}/><div><button onClick={save}>Save</button><input value={id} onChange={e=>setId(e.target.value)} style={{marginLeft:8}}/><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
