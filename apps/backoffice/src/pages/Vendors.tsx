import React, { useEffect, useState } from 'react';

export default function Vendors(){
  const [items,setItems]=useState<any[]>([]);
  const [form,setForm]=useState({name:'',owner:'',tier:'3',risk:0,docs:''});
  const refresh = async ()=> {
    const j = await (await fetch('/api/admin/vendors')).json(); setItems(j.items||[]);
  };
  const upsert = async ()=> {
    await fetch('/api/admin/vendors/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,docs:form.docs?form.docs.split(',').map(s=>s.trim()):[]})});
    await refresh();
  };
  useEffect(()=>{ refresh(); },[]);
  return <section>
    <h2>Vendors</h2>
    <div>
      <input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <input placeholder="Owner" value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})} style={{marginLeft:8}}/>
      <input placeholder="Tier" value={form.tier} onChange={e=>setForm({...form,tier:e.target.value})} style={{marginLeft:8}}/>
      <input placeholder="Risk (0-100)" type="number" value={form.risk} onChange={e=>setForm({...form,risk:Number(e.target.value)})} style={{marginLeft:8}}/>
      <input placeholder="Docs (comma URLs)" value={form.docs} onChange={e=>setForm({...form,docs:e.target.value})} style={{marginLeft:8}}/>
      <button onClick={upsert} style={{marginLeft:8}}>Save</button>
    </div>
    <ul style={{marginTop:12}}>{items.map((v:any)=><li key={v.name}>{v.name} — owner {v.owner} — tier {v.tier} — risk {v.risk}</li>)}</ul>
  </section>;
}
