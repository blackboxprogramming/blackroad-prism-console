import React, { useEffect, useState } from 'react';

export default function Privacy_Consent(){
  const [body,setBody]=useState('{"subject_id":"user@example.com","channel":"web","purpose":"marketing","status":"granted","timestamp":"'+new Date().toISOString()+'"}');
  const [id,setId]=useState('user@example.com'); const [view,setView]=useState<any>({});
  const upsert=async()=>{ await fetch('/api/privacy/consent/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body}); await history(); };
  const history=async()=>{ const j=await (await fetch(`/api/privacy/consent/history?subject_id=${encodeURIComponent(id)}`)).json(); setView(j); };
  useEffect(()=>{ history(); },[]);
  return <section><h2>Consent Registry</h2>
    <textarea value={body} onChange={e=>setBody(e.target.value)} style={{width:'100%',height:120}}/><div><button onClick={upsert}>Upsert</button><input value={id} onChange={e=>setId(e.target.value)} style={{marginLeft:8}}/><button onClick={history} style={{marginLeft:8}}>History</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>
  </section>;
}
