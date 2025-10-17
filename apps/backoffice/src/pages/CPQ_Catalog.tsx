import React, { useEffect, useState } from 'react';

export default function CPQ_Catalog(){
  const [items,setItems]=useState<any[]>([]);
  const [form,setForm]=useState({sku:'BR-PRO',name:'BlackRoad Pro',family:'SaaS',plan:'PRO',uom:'seat',price:99,currency:'USD',metered:false,addons:''});
  const load=async()=>{ const j=await (await fetch('/api/cpq/catalog/list')).json(); setItems(j.items||[]); };
  const upsert=async()=>{ const body={...form,addons: form.addons?form.addons.split(',').map(s=>s.trim()):[]}; await fetch('/api/cpq/catalog/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); await load(); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>CPQ Catalog</h2>
    <div><input placeholder="SKU" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})}/>
      <input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{marginLeft:8}}/>
      <input placeholder="Family" value={form.family} onChange={e=>setForm({...form,family:e.target.value})} style={{marginLeft:8}}/>
      <input placeholder="Plan" value={form.plan} onChange={e=>setForm({...form,plan:e.target.value})} style={{marginLeft:8}}/>
      <input placeholder="UoM" value={form.uom} onChange={e=>setForm({...form,uom:e.target.value})} style={{marginLeft:8}}/>
      <input type="number" placeholder="Price" value={form.price} onChange={e=>setForm({...form,price:Number(e.target.value)})} style={{marginLeft:8,width:100}}/>
      <input placeholder="Currency" value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})} style={{marginLeft:8,width:80}}/>
      <label style={{marginLeft:8}}><input type="checkbox" checked={form.metered} onChange={e=>setForm({...form,metered:e.target.checked})}/> metered</label>
      <input placeholder="Add-ons (csv)" value={form.addons} onChange={e=>setForm({...form,addons:e.target.value})} style={{marginLeft:8,width:220}}/>
      <button onClick={upsert} style={{marginLeft:8}}>Upsert</button>
    </div>
    <ul style={{marginTop:12}}>{items.map((x:any)=><li key={x.sku}><b>{x.sku}</b> — {x.name} — {x.plan} — {x.price} {x.currency}</li>)}</ul>
  </section>;
}
