import React, { useEffect, useState } from 'react';

export default function BCDR_Backups(){
  const [form,setForm]=useState('{"id":"bk-api-db","service":"api","type":"db","location":"s3://backups/api","schedule":"daily","retention_days":30}');
  const [id,setId]=useState('bk-api-db'); const [recent,setRecent]=useState<any>({});
  const reg=async()=>{ await fetch('/api/bcdr/backups/register',{method:'POST',headers:{'Content-Type':'application/json'},body:form}); };
  const report=async()=>{ const body={id, date:new Date().toISOString().slice(0,10), status:'success', size_gb:5.2, duration_s:120}; await fetch('/api/bcdr/backups/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/bcdr/backups/recent?id=${id}`)).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Backups Registry & Status</h2>
    <textarea value={form} onChange={e=>setForm(e.target.value)} style={{width:'100%',height:120}}/><div><button onClick={reg}>Register</button><input value={id} onChange={e=>setId(e.target.value)} style={{marginLeft:8}}/><button onClick={report} style={{marginLeft:8}}>Report</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
