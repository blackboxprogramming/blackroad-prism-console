import React, { useEffect, useState } from 'react';

export default function Tax_EInvoices(){
  const [invoiceId,setInvoiceId]=useState('INV-1001'); const [status,setStatus]=useState<any>(null);
  const create=async()=>{ await fetch('/api/tax/einv/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invoiceId,customer:{name:'ACME'},lines:[{sku:'BR-PRO',qty:5,unit_price:99,tax_code:'STD'}],totals:{}})}); };
  const transmit=async()=>{ await fetch('/api/tax/einv/transmit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invoiceId,channel:'peppol'})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/tax/einv/status/${invoiceId}`)).json(); setStatus(j); };
  useEffect(()=>{ /* no-op */ },[]);
  return <section><h2>E-Invoices</h2>
    <div><input value={invoiceId} onChange={e=>setInvoiceId(e.target.value)}/><button onClick={create} style={{marginLeft:8}}>Create</button><button onClick={transmit} style={{marginLeft:8}}>Transmit</button><button onClick={load} style={{marginLeft:8}}>Status</button></div>
    {status && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(status,null,2)}</pre>}
  </section>;
}
