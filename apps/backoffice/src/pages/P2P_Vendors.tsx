import React, { useEffect, useState } from 'react';

export default function P2P_Vendors(){
  const [form,setForm]=useState({id:'VEND-1',name:'Acme Parts',tax_id:'12-3456789',country:'US',terms:'NET30',status:'active'});
  const [list,setList]=useState<any[]>([]);
  const save=async()=>{ await fetch('/api/p2p/vendors/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/p2p/vendors/list')).json(); setList(j||[]); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Vendors</h2>
    <div><input value={form.id} onChange={e=>setForm({...form,id:e.target.value})}/><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{marginLeft:8}}/>
      <input value={form.tax_id} onChange={e=>setForm({...form,tax_id:e.target.value})} style={{marginLeft:8}}/><input value={form.country} onChange={e=>setForm({...form,country:e.target.value})} style={{marginLeft:8}}/>
      <input value={form.terms} onChange={e=>setForm({...form,terms:e.target.value})} style={{marginLeft:8}}/><input value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={{marginLeft:8}}/>
      <button onClick={save} style={{marginLeft:8}}>Save</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(list,null,2)}</pre>
  </section>;
}
