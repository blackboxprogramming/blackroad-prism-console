import React, { useEffect, useState } from 'react';

export default function ATS_Jobs_Candidates(){
  const [job,setJob]=useState({id:'JOB-1',title:'Senior Engineer',dept:'Platform',location:'Remote-US',hiring_manager:'mgr1',opened:'2025-09-01',tags:['backend'],description_md:'# Role',openings:1});
  const [cand,setCand]=useState({id:'CAND-1',name:'Alex Doe',email:'alex@example.com',linkedin:'https://linkedin.com/in/alex'});
  const [jv,setJv]=useState<any>(null); const [cv,setCv]=useState<any>(null);
  const saveJ=async()=>{ await fetch('/api/ats/jobs/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(job)}); await loadJ(); };
  const saveC=async()=>{ await fetch('/api/ats/candidates/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(cand)}); await loadC(); };
  const loadJ=async()=>{ const j=await (await fetch(`/api/ats/jobs/${job.id}`)).json(); setJv(j); };
  const loadC=async()=>{ const j=await (await fetch(`/api/ats/candidates/${cand.id}`)).json(); setCv(j); };
  useEffect(()=>{ loadJ(); loadC(); },[]);
  return <section><h2>Jobs & Candidates</h2>
    <div><button onClick={saveJ}>Save Job</button><button onClick={saveC} style={{marginLeft:8}}>Save Candidate</button></div>
    <textarea value={JSON.stringify(job,null,2)} onChange={e=>setJob(JSON.parse(e.target.value))} style={{width:'100%',height:140,marginTop:8}}/>
    <textarea value={JSON.stringify(cand,null,2)} onChange={e=>setCand(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    {jv && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(jv,null,2)}</pre>}
    {cv && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(cv,null,2)}</pre>}
  </section>;
}
