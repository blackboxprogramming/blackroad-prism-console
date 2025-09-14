import React, { useEffect, useState } from 'react';

export default function TRE_Payments_Signatories(){
  const [pay,setPay]=useState({paymentId:'PY-1',accountId:'op-usd',method:'ACH',currency:'USD',amount:1250,beneficiary:{name:'Supplier Co',account:'000222333',routing:'011000015'},purpose:'Invoice 1001',due_date:'2025-09-22'});
  const [approve,setApprove]=useState({paymentId:'PY-1',approver:'cfo'});
  const [sig,setSig]=useState('{"list":[{"userId":"cfo","role":"approver","limit":100000},{"userId":"treasurer","role":"approver","limit":250000}]}');
  const [recent,setRecent]=useState<any>({});
  const create=async()=>{ await fetch('/api/tre/payments/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pay)}); await list(); };
  const ok=async()=>{ const j=await (await fetch('/api/tre/limits/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({paymentId:'PY-1'})})).json(); alert(JSON.stringify(j)); };
  const approveF=async()=>{ await fetch('/api/tre/payments/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(approve)}); };
  const exportF=async()=>{ const j=await (await fetch('/api/tre/payments/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({batchId:'B1',paymentIds:['PY-1'],format:'WIRE-CSV'})})).json(); alert(j.file); };
  const saveSig=async()=>{ await fetch('/api/tre/signatories/set',{method:'POST',headers:{'Content-Type':'application/json'},body:sig}); };
  const list=async()=>{ const j=await (await fetch('/api/tre/payments/recent?accountId=op-usd')).json(); setRecent(j); };
  useEffect(()=>{ list(); },[]);
  return <section><h2>Payments & Signatories</h2>
    <div><button onClick={create}>Create</button><button onClick={ok} style={{marginLeft:8}}>Limit Check</button><button onClick={approveF} style={{marginLeft:8}}>Approve</button><button onClick={exportF} style={{marginLeft:8}}>Export</button><button onClick={saveSig} style={{marginLeft:8}}>Save Signatories</button><button onClick={list} style={{marginLeft:8}}>Recent</button></div>
    <textarea value={JSON.stringify(pay,null,2)} onChange={e=>setPay(JSON.parse(e.target.value))} style={{width:'100%',height:140,marginTop:8}}/>
    <textarea value={sig} onChange={e=>setSig(e.target.value)} style={{width:'100%',height:100,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
