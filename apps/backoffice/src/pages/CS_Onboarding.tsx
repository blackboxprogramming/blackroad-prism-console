import React, { useEffect, useState } from 'react';

export default function CS_Onboarding(){
  const [tmpl,setTmpl]=useState('{"key":"saas_default","steps":[{"id":"kickoff","title":"Kickoff","owner":"csm","days_from_start":0},{"id":"training","title":"Admin Training","owner":"csm","days_from_start":7}]}');
  const [start,setStart]=useState('{"accountId":"A-1","key":"saas_default","start":"2025-09-01"}');
  const [accountId,setAccountId]=useState('A-1'); const [view,setView]=useState<any>(null);
  const saveT=async()=>{ await fetch('/api/cs/onboarding/template',{method:'POST',headers:{'Content-Type':'application/json'},body:tmpl}); };
  const begin=async()=>{ await fetch('/api/cs/onboarding/start',{method:'POST',headers:{'Content-Type':'application/json'},body:start}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/cs/onboarding/status?accountId=${accountId}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Onboarding</h2>
    <h4>Template</h4><textarea value={tmpl} onChange={e=>setTmpl(e.target.value)} style={{width:'100%',height:140}}/><button onClick={saveT}>Save</button>
    <h4 style={{marginTop:12}}>Start</h4><textarea value={start} onChange={e=>setStart(e.target.value)} style={{width:'100%',height:100}}/><button onClick={begin}>Start</button>
    <div style={{marginTop:12}}><input value={accountId} onChange={e=>setAccountId(e.target.value)}/><button onClick={load} style={{marginLeft:8}}>Status</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
