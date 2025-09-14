import React, { useEffect, useState } from 'react';

export default function ESG_Offsets_Suppliers(){
  const [off,setOff]=useState({projectId:'proj-1',type:'REC',vintage:2024,tCO2e:10,certificateRef:'REC-123',retired:false});
  const [req,setReq]=useState({vendorId:'vend-1',framework:'CDP',due:'2025-10-31'});
  const [sub,setSub]=useState({vendorId:'vend-1',emissions:{S1:100,S2:150,S3:300},initiatives:['renewables']});
  const [recent,setRecent]=useState<any>({});
  const record=async()=>{ await fetch('/api/esg/offsets/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(off)}); };
  const request=async()=>{ await fetch('/api/esg/suppliers/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(req)}); };
  const submit=async()=>{ await fetch('/api/esg/suppliers/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sub)}); await status(); };
  const status=async()=>{ const j=await (await fetch('/api/esg/suppliers/status?vendorId=vend-1')).json(); setRecent(j); };
  useEffect(()=>{ status(); },[]);
  return <section><h2>ESG: Offsets & Suppliers</h2>
    <div><button onClick={record}>Record Offset/REC</button><button onClick={request} style={{marginLeft:8}}>Request Supplier</button><button onClick={submit} style={{marginLeft:8}}>Submit Supplier</button><button onClick={status} style={{marginLeft:8}}>Status</button></div>
    <textarea value={JSON.stringify(off,null,2)} onChange={e=>setOff(JSON.parse(e.target.value))} style={{width:'100%',height:110,marginTop:8}}/>
    <textarea value={JSON.stringify(req,null,2)} onChange={e=>setReq(JSON.parse(e.target.value))} style={{width:'100%',height:100,marginTop:8}}/>
    <textarea value={JSON.stringify(sub,null,2)} onChange={e=>setSub(JSON.parse(e.target.value))} style={{width:'100%',height:110,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
