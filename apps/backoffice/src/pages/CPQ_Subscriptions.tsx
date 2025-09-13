import React, { useState } from 'react';

export default function CPQ_Subscriptions(){
  const [id,setId]=useState(''); const [view,setView]=useState<any>(null);
  const create=async()=>{ const customer=prompt('Customer?')||''; const sku=prompt('SKU?','BR-PRO')||'BR-PRO'; const qty=Number(prompt('Qty?','5')||'5'); const start=new Date().toISOString().slice(0,10); const j=await (await fetch('/api/cpq/subscription/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer,sku,qty,start,interval:'month'})})).json(); setId(j.id); };
  const load=async()=>{ if(!id) return; const j=await (await fetch(`/api/cpq/subscription/${id}`)).json(); setView(j); };
  return <section><h2>Subscriptions</h2>
    <div><button onClick={create}>Create</button><input placeholder="Subscription ID" value={id} onChange={e=>setId(e.target.value)} style={{marginLeft:8}}/><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{view?JSON.stringify(view,null,2):''}</pre>
  </section>;
}
