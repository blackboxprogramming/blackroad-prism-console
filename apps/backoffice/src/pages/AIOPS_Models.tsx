import React, { useEffect, useState } from 'react';

export default function AIOPS_Models(){
  const [form,setForm]=useState({modelId:'churn_xgb',version:'1.0.0',expId:'exp-001',metrics:{auc:0.89},artifact_path:'s3://models/churn_xgb/1.0.0',card_md:'# Card\\nSummary'});
  const [view,setView]=useState<any>({});
  const register=async()=>{ await fetch('/api/aiops/models/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); await list(); };
  const list=async()=>{ const j=await (await fetch(`/api/aiops/models/${form.modelId}`)).json(); setView(j); };
  useEffect(()=>{ list(); },[]);
  return <section><h2>Model Registry</h2>
    <div><input value={form.modelId} onChange={e=>setForm({...form,modelId:e.target.value})}/><input value={form.version} onChange={e=>setForm({...form,version:e.target.value})} style={{marginLeft:8}}/><button onClick={register} style={{marginLeft:8}}>Register</button><button onClick={list} style={{marginLeft:8}}>List</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>
  </section>;
}
