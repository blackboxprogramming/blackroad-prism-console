import React, { useEffect, useState } from 'react';

export default function CONS_Entities(){
  const [form,setForm]=useState({id:'US-CO',name:'BlackRoad US Corp',currency:'USD',parentId:'',ownership_pct:100,method:'full'});
  const [list,setList]=useState<any[]>([]);
  const save=async()=>{ await fetch('/api/cons/entities/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/cons/entities/list')).json(); setList(j||[]); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Entities & Ownership</h2>
    <div><input value={form.id} onChange={e=>setForm({...form,id:e.target.value})}/><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{marginLeft:8}}/><input value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})} style={{marginLeft:8}}/><input placeholder="parent" value={form.parentId} onChange={e=>setForm({...form,parentId:e.target.value})} style={{marginLeft:8}}/><input type="number" value={form.ownership_pct} onChange={e=>setForm({...form,ownership_pct:Number(e.target.value)})} style={{marginLeft:8,width:100}}/><select value={form.method} onChange={e=>setForm({...form,method:e.target.value})} style={{marginLeft:8}}><option>full</option><option>equity</option><option>prop</option></select><button onClick={save} style={{marginLeft:8}}>Save</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(list,null,2)}</pre>
  </section>;
}
