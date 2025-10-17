import React, { useEffect, useState } from 'react';

export default function AIOPS_Datasets_Features(){
  const [ds,setDs]=useState({id:'crm_contacts',name:'CRM Contacts',source:'warehouse',owner:'data',schema:{fields:['id','email','country']},pii:true});
  const [ft,setFt]=useState({id:'churn_features_v1',datasetId:'crm_contacts',description:'basic churn features',keys:['id'],fields:['email_domain','country','tenure_days']});
  const [view,setView]=useState<any>(null);
  const saveDs=async()=>{ await fetch('/api/aiops/datasets/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(ds)}); await load(); };
  const saveFt=async()=>{ await fetch('/api/aiops/features/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(ft)}); };
  const load=async()=>{ const j=await (await fetch(`/api/aiops/datasets/${ds.id}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Datasets & Features</h2>
    <div><input value={ds.id} onChange={e=>setDs({...ds,id:e.target.value})}/><input value={ds.name} onChange={e=>setDs({...ds,name:e.target.value})} style={{marginLeft:8}}/><button onClick={saveDs} style={{marginLeft:8}}>Save Dataset</button></div>
    <div style={{marginTop:8}}><input value={ft.id} onChange={e=>setFt({...ft,id:e.target.value})}/><input value={ft.datasetId} onChange={e=>setFt({...ft,datasetId:e.target.value})} style={{marginLeft:8}}/><button onClick={saveFt} style={{marginLeft:8}}>Save FeatureSet</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
