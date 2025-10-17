import React, { useEffect, useState } from 'react';

export default function IAM_Devices(){
  const [form,setForm]=useState('{"deviceId":"host-1","owner":"u1","posture":{"encrypted":true,"compliant":true,"lastSeen":'+Date.now()+'}}');
  const [qry,setQry]=useState('host-1'); const [view,setView]=useState<any>(null);
  const attest=async()=>{ await fetch('/api/iam/devices/attest',{method:'POST',headers:{'Content-Type':'application/json'},body:form}); await status(); };
  const status=async()=>{ const j=await (await fetch(`/api/iam/devices/status?deviceId=${encodeURIComponent(qry)}`)).json(); setView(j); };
  useEffect(()=>{ status(); },[]);
  return <section><h2>Device Trust</h2>
    <textarea value={form} onChange={e=>setForm(e.target.value)} style={{width:'100%',height:120}}/><div><button onClick={attest}>Attest</button><input value={qry} onChange={e=>setQry(e.target.value)} style={{marginLeft:8}}/><button onClick={status} style={{marginLeft:8}}>Status</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
