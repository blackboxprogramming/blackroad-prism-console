import React, { useEffect, useState } from 'react';

export default function Flags(){
  const [items,setItems]=useState<any>({}); const [form,setForm]=useState({key:'feature_x',default:false,description:''}); const [pct,setPct]=useState(0);
  const load=async()=>{ const j=await (await fetch('/api/product/flags/list')).json(); setItems(j||{}); };
  const upsert=async()=>{ await fetch('/api/product/flags/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); await load(); };
  const rollout=async()=>{ await fetch('/api/product/flags/rollout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:form.key,percent:pct})}); await load(); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Feature Flags</h2>
    <div><input placeholder="key" value={form.key} onChange={e=>setForm({...form,key:e.target.value})}/><input type="checkbox" checked={form.default} onChange={e=>setForm({...form,default:e.target.checked})} style={{marginLeft:8}}/> default
      <input placeholder="description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{marginLeft:8,width:300}}/>
      <button onClick={upsert} style={{marginLeft:8}}>Upsert</button></div>
    <div style={{marginTop:8}}><input type="number" value={pct} onChange={e=>setPct(Number(e.target.value))}/><button onClick={rollout} style={{marginLeft:8}}>Rollout %</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(items,null,2)}</pre>
  </section>;
}
