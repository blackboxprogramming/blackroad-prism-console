import React, { useEffect, useState } from 'react';

export default function Privacy_DSAR(){
  const [createBody,setCreateBody]=useState('{"subject_id":"user@example.com","type":"export","channel":"web","notes":""}');
  const [requestId,setRequestId]=useState(''); const [status,setStatus]=useState<any>({});
  const create=async()=>{ const j=await (await fetch('/api/privacy/dsar/create',{method:'POST',headers:{'Content-Type':'application/json'},body:createBody})).json(); setRequestId(j.requestId); };
  const verify=async()=>{ await fetch('/api/privacy/dsar/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId,method:'email',status:'pass'})}); };
  const fulfill=async()=>{ await fetch('/api/privacy/dsar/fulfill',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId,result:'completed',export_path:'/privacy/exports/EX-'+Date.now()+'.zip'})}); };
  const view=async()=>{ const j=await (await fetch(`/api/privacy/dsar/status/${requestId}`)).json(); setStatus(j); };
  useEffect(()=>{},[]);
  return <section><h2>DSAR</h2>
    <textarea value={createBody} onChange={e=>setCreateBody(e.target.value)} style={{width:'100%',height:120}}/>
    <div><button onClick={create}>Create</button><input placeholder="requestId" value={requestId} onChange={e=>setRequestId(e.target.value)} style={{marginLeft:8}}/><button onClick={verify} style={{marginLeft:8}}>Verify</button><button onClick={fulfill} style={{marginLeft:8}}>Fulfill</button><button onClick={view} style={{marginLeft:8}}>Status</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(status,null,2)}</pre>
  </section>;
}
