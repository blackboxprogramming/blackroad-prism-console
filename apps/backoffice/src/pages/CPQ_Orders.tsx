import React, { useState } from 'react';

export default function CPQ_Orders(){
  const [orderId,setOrderId]=useState(''); const [quoteId,setQuoteId]=useState(''); const [view,setView]=useState<any>(null);
  const create=async()=>{ const j=await (await fetch('/api/cpq/order/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({quoteId})})).json(); setOrderId(j.id); };
  const load=async()=>{ if(!orderId) return; const j=await (await fetch(`/api/cpq/order/${orderId}`)).json(); setView(j); };
  return <section><h2>Orders</h2>
    <div><input placeholder="Quote ID" value={quoteId} onChange={e=>setQuoteId(e.target.value)}/><button onClick={create} style={{marginLeft:8}}>Create Order</button></div>
    <div style={{marginTop:8}}><input placeholder="Order ID" value={orderId} onChange={e=>setOrderId(e.target.value)}/><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{view?JSON.stringify(view,null,2):''}</pre>
  </section>;
}
