import React, { useState } from 'react';

export default function RevRec_Contracts(){
  const [contractId,setContractId]=useState('C-1001');
  const [customer,setCustomer]=useState('ACME');
  const [lines,setLines]=useState('[{"sku":"BR-PRO","qty":10,"price":99,"ssp":120}]');
  const [oblig,setOblig]=useState('[{"poId":"PO-1","desc":"SaaS subscription","ssp":1200}]');
  const create=async()=>{ const body={contractId,customer,currency:'USD',start:'2025-01-01',end:'2025-12-31',lines:JSON.parse(lines),obligations:JSON.parse(oblig)}; await fetch('/api/revrec/contract/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); alert('Created'); };
  const view=async()=>{ const j=await (await fetch(`/api/revrec/contract/${contractId}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>RevRec Contracts</h2>
    <div><input value={contractId} onChange={e=>setContractId(e.target.value)}/><input value={customer} onChange={e=>setCustomer(e.target.value)} style={{marginLeft:8}}/><button onClick={create} style={{marginLeft:8}}>Create</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
    <textarea value={lines} onChange={e=>setLines(e.target.value)} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={oblig} onChange={e=>setOblig(e.target.value)} style={{width:'100%',height:120,marginTop:8}}/>
  </section>;
}
