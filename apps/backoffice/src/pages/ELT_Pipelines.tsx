import React, { useEffect, useState } from 'react';

export default function ELT_Pipelines(){
  const [p,setP]=useState({id:'crm_to_silver_contacts',name:'CRM → Silver Contacts',schedule:'@daily',source:'crm_jdbc',transforms:['cleanse_emails','mdm_lookup'],sink:'lake_delta',owner:'data',sla:{freshness_min:60,success_rate:0.99},tags:{domain:'sales'}});
  const [view,setView]=useState<any>({});
  const upsert=async()=>{ await fetch('/api/elt/pipelines/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/elt/pipelines/${p.id}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Pipelines</h2>
    <div><input value={p.id} onChange={e=>setP({...p,id:e.target.value})}/><input value={p.name} onChange={e=>setP({...p,name:e.target.value})} style={{marginLeft:8}}/><button onClick={upsert} style={{marginLeft:8}}>Upsert</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <textarea value={JSON.stringify(p,null,2)} onChange={e=>setP(JSON.parse(e.target.value))} style={{width:'100%',height:160,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>
  </section>;
}
