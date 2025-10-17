import React, { useEffect, useState } from 'react';

export default function P2P_Items(){
  const [form,setForm]=useState({sku:'ITM-1',description:'Widget',uom:'ea',default_price:10,tax_code:'STD'});
  const [list,setList]=useState<any[]>([]);
  const save=async()=>{ await fetch('/api/p2p/items/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/p2p/items/list')).json(); setList(j||[]); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Items</h2>
    <div><input value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})}/><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{marginLeft:8}}/>
      <input value={form.uom} onChange={e=>setForm({...form,uom:e.target.value})} style={{marginLeft:8}}/><input type="number" value={form.default_price} onChange={e=>setForm({...form,default_price:Number(e.target.value)})} style={{marginLeft:8}}/>
      <input value={form.tax_code} onChange={e=>setForm({...form,tax_code:e.target.value})} style={{marginLeft:8}}/><button onClick={save} style={{marginLeft:8}}>Save</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(list,null,2)}</pre>
  </section>;
}
