import React, { useEffect, useState } from 'react';

export default function Roadmap(){
  const [q,setQ]=useState('2025Q4'); const [items,setItems]=useState<any[]>([]);
  const [form,setForm]=useState({quarter:'2025Q4',epic:'EP-1',title:'Epic One',owner:'PM',status:'planned',links:''});
  const save=async()=>{ await fetch('/api/product/roadmap/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,links:form.links?form.links.split(',').map(s=>s.trim()):[]})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/product/roadmap/${q}`)).json(); setItems(j.items||[]); };
  useEffect(()=>{ load(); },[q]);
  return <section><h2>Roadmap</h2>
    <div><input value={q} onChange={e=>setQ(e.target.value)}/><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <div style={{marginTop:8}}><input placeholder="quarter" value={form.quarter} onChange={e=>setForm({...form,quarter:e.target.value})}/>
      <input placeholder="epic" value={form.epic} onChange={e=>setForm({...form,epic:e.target.value})} style={{marginLeft:8}}/>
      <input placeholder="title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={{marginLeft:8}}/>
      <input placeholder="owner" value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})} style={{marginLeft:8}}/>
      <input placeholder="status" value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={{marginLeft:8}}/>
      <input placeholder="links (csv)" value={form.links} onChange={e=>setForm({...form,links:e.target.value})} style={{marginLeft:8}}/>
      <button onClick={save} style={{marginLeft:8}}>Save</button></div>
    <ul style={{marginTop:12}}>{items.map((x:any)=><li key={x.epic}><b>{x.epic}</b> — {x.title} — {x.owner} — {x.status}</li>)}</ul>
  </section>;
}
