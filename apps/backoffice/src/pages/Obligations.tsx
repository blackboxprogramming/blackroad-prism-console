import React, { useEffect, useState } from 'react';

export default function Obligations(){
  const [items,setItems]=useState<any[]>([]);
  const [form,setForm]=useState({contractId:'',title:'',due:''});
  const refresh=async()=>{ const j=await (await fetch('/api/clm/obligations/list')).json(); setItems(j.items||[]); };
  const add=async()=>{ await fetch('/api/clm/obligations/add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); await refresh(); };
  const done=async(id:string)=>{ await fetch('/api/clm/obligations/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}); await refresh(); };
  useEffect(()=>{ refresh(); },[]);
  return <section><h2>Obligations</h2>
    <div>
      <input placeholder="Contract ID" value={form.contractId} onChange={e=>setForm({...form,contractId:e.target.value})}/>
      <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={{marginLeft:8}}/>
      <input placeholder="Due (YYYY-MM-DD)" value={form.due} onChange={e=>setForm({...form,due:e.target.value})} style={{marginLeft:8}}/>
      <button onClick={add} style={{marginLeft:8}}>Add</button>
      <button onClick={refresh} style={{marginLeft:8}}>Refresh</button>
    </div>
    <ul style={{marginTop:12}}>{items.map(o=><li key={o.id}>{o.contractId} — {o.title} — due {o.due} — {o.status} <button onClick={()=>done(o.id)} style={{marginLeft:6}}>Complete</button></li>)}</ul>
  </section>;
}
