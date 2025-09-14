import React, { useEffect, useState } from 'react';

export default function TPRM_Vendors(){
  const [v,setV]=useState({id:'vend-1',name:'Acme Security',category:'security',criticality:'high',contacts:[{name:'Bob',email:'bob@acme.com'}],jurisdictions:['US'],data_types:['PII'],integrations:['sso'],status:'active'});
  const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/tprm/vendors/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(v)}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/tprm/vendors/${v.id}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Vendors</h2>
    <div><input value={v.id} onChange={e=>setV({...v,id:e.target.value})}/><input value={v.name} onChange={e=>setV({...v,name:e.target.value})} style={{marginLeft:8}}/><select value={v.criticality} onChange={e=>setV({...v,criticality:e.target.value})} style={{marginLeft:8}}><option>low</option><option>med</option><option>high</option></select><button onClick={save} style={{marginLeft:8}}>Save</button></div>
    <textarea value={JSON.stringify(v,null,2)} onChange={e=>setV(JSON.parse(e.target.value))} style={{width:'100%',height:140,marginTop:8}}/>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
