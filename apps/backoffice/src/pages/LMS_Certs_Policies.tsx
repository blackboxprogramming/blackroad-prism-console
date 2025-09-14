import React, { useEffect, useState } from 'react';

export default function LMS_Certs_Policies(){
  const [policy,setPolicy]=useState({id:'code-of-conduct',title:'Code of Conduct',md:'# Conduct',required:true});
  const [ack,setAck]=useState({policyId:'code-of-conduct',subjectId:'u1'});
  const [cert,setCert]=useState({subjectId:'u1',certId:'sec-awareness',name:'Security Awareness',issued:new Date().toISOString().slice(0,10),expires:new Date(Date.now()+365*86400000).toISOString().slice(0,10)});
  const [pstat,setPstat]=useState<any>({}); const [cstat,setCstat]=useState<any>({});
  const saveP=async()=>{ await fetch('/api/lms/policies/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(policy)}); };
  const doAck=async()=>{ await fetch('/api/lms/policies/ack',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(ack)}); await loadP(); };
  const issue=async()=>{ await fetch('/api/lms/certs/issue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(cert)}); await loadC(); };
  const loadP=async()=>{ const j=await (await fetch('/api/lms/policies/status?subjectId=u1')).json(); setPstat(j); };
  const loadC=async()=>{ const j=await (await fetch('/api/lms/certs/status?subjectId=u1')).json(); setCstat(j); };
  useEffect(()=>{ loadP(); loadC(); },[]);
  return <section><h2>Certifications & Policies</h2>
    <div><button onClick={saveP}>Save Policy</button><button onClick={doAck} style={{marginLeft:8}}>Acknowledge</button><button onClick={issue} style={{marginLeft:8}}>Issue Cert</button></div>
    <textarea value={JSON.stringify(policy,null,2)} onChange={e=>setPolicy(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(ack,null,2)} onChange={e=>setAck(JSON.parse(e.target.value))} style={{width:'100%',height:90,marginTop:8}}/>
    <textarea value={JSON.stringify(cert,null,2)} onChange={e=>setCert(JSON.parse(e.target.value))} style={{width:'100%',height:110,marginTop:8}}/>
    <h4 style={{marginTop:8}}>Policy Status</h4><pre style={{background:'#f7f7f7',padding:8}}>{JSON.stringify(pstat,null,2)}</pre>
    <h4>Cert Status</h4><pre style={{background:'#f7f7f7',padding:8}}>{JSON.stringify(cstat,null,2)}</pre>
  </section>;
}
