import React, { useState } from 'react';

export default function AR_Payments(){
  const [invoiceId,setInvoiceId]=useState('INV-1001'); const [paymentRef,setPaymentRef]=useState('PMT-1');
  const pay=async()=>{ await fetch('/api/ar/payment/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invoiceId,method:'ach',amount:150,currency:'USD',date:new Date().toISOString().slice(0,10),ref:paymentRef})}); };
  const apply=async()=>{ await fetch('/api/ar/cash/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({paymentRef,invoiceId,amount:150})}); };
  const recent=async()=>{ const j=await (await fetch(`/api/ar/payment/recent?invoiceId=${invoiceId}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>Payments & Cash App</h2>
    <div><input placeholder="invoice" value={invoiceId} onChange={e=>setInvoiceId(e.target.value)}/><input placeholder="paymentRef" value={paymentRef} onChange={e=>setPaymentRef(e.target.value)} style={{marginLeft:8}}/><button onClick={pay} style={{marginLeft:8}}>Record</button><button onClick={apply} style={{marginLeft:8}}>Apply</button><button onClick={recent} style={{marginLeft:8}}>Recent</button></div>
  </section>;
}
