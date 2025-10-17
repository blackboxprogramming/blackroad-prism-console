import React, { useEffect, useState } from 'react';

export default function TPRM_Risk_Issues(){
  const [score,setScore]=useState({vendorId:'vend-1',dimensions:{security:0.7,privacy:0.8,financial:0.9,operational:0.85,compliance:0.75},external_signals:{}});
  const [issue,setIssue]=useState({vendorId:'vend-1',issueId:'iss-1',title:'SOC 2 expired',severity:'high',status:'open',owner:'secops',due:'2025-10-01'});
  const [recent,setRecent]=useState<any>({});
  const postScore=async()=>{ await fetch('/api/tprm/risk/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(score)}); };
  const logIssue=async()=>{ await fetch('/api/tprm/issues/log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(issue)}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/tprm/issues/recent?vendorId=vend-1')).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Risk & Issues</h2>
    <div><button onClick={postScore}>Score</button><button onClick={logIssue} style={{marginLeft:8}}>Log Issue</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <textarea value={JSON.stringify(score,null,2)} onChange={e=>setScore(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(issue,null,2)} onChange={e=>setIssue(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
