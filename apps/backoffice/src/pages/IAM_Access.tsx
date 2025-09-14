import React, { useEffect, useState } from 'react';

export default function IAM_Access(){
  const [req,setReq]=useState({requestId:'REQ-1',subjectId:'u1',resource:'secrets',role:'reader',reason:'investigate'});
  const [items,setItems]=useState<any>({});
  const request=async()=>{ await fetch('/api/iam/access/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(req)}); await load(); };
  const approve=async()=>{ await fetch('/api/iam/access/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:req.requestId,approver:'secops',decision:'approve'})}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/iam/access/recent')).json(); setItems(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Access Requests</h2>
    <div><input value={req.requestId} onChange={e=>setReq({...req,requestId:e.target.value})}/><input value={req.subjectId} onChange={e=>setReq({...req,subjectId:e.target.value})} style={{marginLeft:8}}/><button onClick={request} style={{marginLeft:8}}>Request</button><button onClick={approve} style={{marginLeft:8}}>Approve</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(items,null,2)}</pre>
  </section>;
}
