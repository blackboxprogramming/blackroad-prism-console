import React, { useEffect, useState } from 'react';

export default function PA_Ingest_Sessions(){
  const [evt,setEvt]=useState({write_key:'<REPLACE_WITH_KEY>',subjectId:'u1',sessionId:'s1',event:'App Launched',properties:{platform:'web'}});
  const [idn,setIdn]=useState({subjectId:'u1',traits:{plan:'pro'}});
  const [grp,setGrp]=useState({subjectId:'u1',groupId:'org-1',traits:{tier:'enterprise'}});
  const [sessS,setSS]=useState({sessionId:'s1',subjectId:'u1'}); const [sessE,setSE]=useState({sessionId:'s1'});
  const [recent,setRecent]=useState<any>({});
  const ingest=async()=>{ await fetch('/api/pa/ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(evt)}); await load(); };
  const identify=async()=>{ await fetch('/api/pa/identify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(idn)}); };
  const group=async()=>{ await fetch('/api/pa/group',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(grp)}); };
  const sstart=async()=>{ await fetch('/api/pa/session/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sessS)}); };
  const send=async()=>{ await fetch('/api/pa/session/end',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sessE)}); };
  const load=async()=>{ const j=await (await fetch('/api/pa/events/recent?subjectId=u1')).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>PA: Ingest & Sessions</h2>
    <div><button onClick={ingest}>Ingest</button><button onClick={identify} style={{marginLeft:8}}>Identify</button><button onClick={group} style={{marginLeft:8}}>Group</button><button onClick={sstart} style={{marginLeft:8}}>Session Start</button><button onClick={send} style={{marginLeft:8}}>Session End</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <textarea value={JSON.stringify(evt,null,2)} onChange={e=>setEvt(JSON.parse(e.target.value))} style={{width:'100%',height:130,marginTop:8}}/>
    <textarea value={JSON.stringify(idn,null,2)} onChange={e=>setIdn(JSON.parse(e.target.value))} style={{width:'100%',height:100,marginTop:8}}/>
    <textarea value={JSON.stringify(grp,null,2)} onChange={e=>setGrp(JSON.parse(e.target.value))} style={{width:'100%',height:100,marginTop:8}}/>
    <textarea value={JSON.stringify(sessS,null,2)} onChange={e=>setSS(JSON.parse(e.target.value))} style={{width:'100%',height:90,marginTop:8}}/>
    <textarea value={JSON.stringify(sessE,null,2)} onChange={e=>setSE(JSON.parse(e.target.value))} style={{width:'100%',height:90,marginTop:8}}/>
    <h4>Recent</h4><pre style={{background:'#f7f7f7',padding:8}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
