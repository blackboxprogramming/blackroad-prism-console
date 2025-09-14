import React, { useEffect, useState } from 'react';

export default function CLM_Requests(){
  const [req,setReq]=useState({reqId:'REQ-1',requester:'alice',counterparty:'Acme Corp',type:'MSA',urgency:'med',notes:'New logo'});
  const [items,setItems]=useState<any>({});
  const create=async()=>{ await fetch('/api/clm/requests/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(req)}); await load(); };
  const assign=async()=>{ await fetch('/api/clm/requests/assign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reqId:req.reqId,owner:'legal1'})}); await load(); };
  const setState=async()=>{ await fetch('/api/clm/requests/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reqId:req.reqId,state:'drafting'})}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/clm/requests/recent')).json(); setItems(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Intake & Requests</h2>
    <div><input value={req.reqId} onChange={e=>setReq({...req,reqId:e.target.value})}/><input value={req.counterparty} onChange={e=>setReq({...req,counterparty:e.target.value})} style={{marginLeft:8}}/><button onClick={create} style={{marginLeft:8}}>Create</button><button onClick={assign} style={{marginLeft:8}}>Assign</button><button onClick={setState} style={{marginLeft:8}}>Set State</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(items,null,2)}</pre>
  </section>;
}
