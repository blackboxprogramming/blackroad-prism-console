import React, { useEffect, useState } from 'react';

export default function Privacy_DLP(){
  const [rules,setRules]=useState('{"rules":[{"id":"pii-s3","scope":"storage","class":"PII","pattern":"email","action":"alert"}]}');
  const [ingest,setIngest]=useState('{"source":"lake-scan","items":[{"location":"s3://bucket/path/file.csv","class":"PII","sample_hash":"abc123","action_taken":"alert","ts":"'+new Date().toISOString()+'"}]}');
  const [view,setView]=useState<any>({});
  const save=async()=>{ await fetch('/api/privacy/dlp/rules/set',{method:'POST',headers:{'Content-Type':'application/json'},body:rules}); };
  const send=async()=>{ await fetch('/api/privacy/dlp/findings/ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:ingest}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/privacy/dlp/findings/recent?class=PII')).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>DLP Rules & Findings</h2>
    <textarea value={rules} onChange={e=>setRules(e.target.value)} style={{width:'100%',height:120}}/><div><button onClick={save}>Save Rules</button></div>
    <textarea value={ingest} onChange={e=>setIngest(e.target.value)} style={{width:'100%',height:120,marginTop:8}}/><div><button onClick={send}>Ingest Findings</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>
  </section>;
}
