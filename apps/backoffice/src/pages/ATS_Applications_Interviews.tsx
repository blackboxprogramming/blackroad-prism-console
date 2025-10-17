import React, { useEffect, useState } from 'react';

export default function ATS_Applications_Interviews(){
  const [app,setApp]=useState({appId:'APP-1',jobId:'JOB-1',candidateId:'CAND-1',source:'LinkedIn'});
  const [state,setState]=useState({appId:'APP-1',stage:'Phone Screen'});
  const [intv,setIntv]=useState({interviewId:'INT-1',appId:'APP-1',panel:[{id:'mgr1',email:'mgr@blackroad.io'}],start:'2025-09-22T15:00:00Z',end:'2025-09-22T16:00:00Z',mode:'video',notes:'Intro'});
  const [fb,setFb]=useState({interviewId:'INT-1',reviewerId:'mgr1',ratings:{overall:5},recommend:'yes',notes:'Strong'});
  const [recent,setRecent]=useState<any>({});
  const createA=async()=>{ await fetch('/api/ats/applications/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(app)}); await load(); };
  const change=async()=>{ await fetch('/api/ats/applications/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)}); await load(); };
  const sched=async()=>{ await fetch('/api/ats/interviews/schedule',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(intv)}); await load(); };
  const feedback=async()=>{ await fetch('/api/ats/feedback/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fb)}); };
  const load=async()=>{ const j=await (await fetch('/api/ats/interviews/recent?appId=APP-1')).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Applications & Interviews</h2>
    <div><button onClick={createA}>Create Application</button><button onClick={change} style={{marginLeft:8}}>Advance Stage</button><button onClick={sched} style={{marginLeft:8}}>Schedule</button><button onClick={feedback} style={{marginLeft:8}}>Submit Feedback</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <textarea value={JSON.stringify(app,null,2)} onChange={e=>setApp(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(state,null,2)} onChange={e=>setState(JSON.parse(e.target.value))} style={{width:'100%',height:90,marginTop:8}}/>
    <textarea value={JSON.stringify(intv,null,2)} onChange={e=>setIntv(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(fb,null,2)} onChange={e=>setFb(JSON.parse(e.target.value))} style={{width:'100%',height:110,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
