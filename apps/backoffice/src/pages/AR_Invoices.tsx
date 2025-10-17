import React, { useState } from 'react';

export default function AR_Invoices(){
  const [invoiceId,setInvoiceId]=useState('INV-1001');
  const create=async()=>{ const body={invoiceId,customer:{id:'CUST-1'},currency:'USD',lines:[{sku:'BR-PRO',qty:3,unit_price:99,tax:0,discount:0}],terms:'NET30'}; await fetch('/api/ar/invoice/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); alert('Created'); };
  const state=async()=>{ const s=prompt('state (issued|void|paid)','issued')||'issued'; await fetch('/api/ar/invoice/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invoiceId,state:s})}); };
  const view=async()=>{ const j=await (await fetch(`/api/ar/invoice/${invoiceId}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>AR Invoices</h2>
    <div><input value={invoiceId} onChange={e=>setInvoiceId(e.target.value)}/><button onClick={create} style={{marginLeft:8}}>Create</button><button onClick={state} style={{marginLeft:8}}>Set State</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
  </section>;
}
