import React, { useEffect, useState } from 'react';

export default function FAC_Visitors_Badges(){
  const [pre,setPre]=useState({visitId:'v-1',hostId:'u1',visitor:{name:'Dana',email:'dana@example.com',company:'Guest Co'},locationId:'hq',date:'2025-09-21',nda_required:true});
  const [signin,setSignin]=useState({visitId:'v-1',hostId:'u1',acknowledgement:{nda:true}});
  const [issue,setIssue]=useState({badgeId:'bg-1',subjectId:'u1',access:{locations:['hq'],levels:['office']},expires:'2025-12-31'});
  const [recent,setRecent]=useState<any>({});
  const prereg=async()=>{ await fetch('/api/fac/visitors/preregister',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pre)}); await load(); };
  const sign=async()=>{ await fetch('/api/fac/visitors/signin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(signin)}); await load(); };
  const issueB=async()=>{ await fetch('/api/fac/badges/issue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(issue)}); };
  const revoke=async()=>{ await fetch('/api/fac/badges/revoke',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({badgeId:'bg-1',reason:'lost'})}); };
  const load=async()=>{ const j=await (await fetch('/api/fac/visitors/recent?locationId=hq')).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Visitors & Badges</h2>
    <div><button onClick={prereg}>Pre-register</button><button onClick={sign} style={{marginLeft:8}}>Sign-in</button><button onClick={issueB} style={{marginLeft:8}}>Issue Badge</button><button onClick={revoke} style={{marginLeft:8}}>Revoke Badge</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <textarea value={JSON.stringify(pre,null,2)} onChange={e=>setPre(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(signin,null,2)} onChange={e=>setSignin(JSON.parse(e.target.value))} style={{width:'100%',height:100,marginTop:8}}/>
    <textarea value={JSON.stringify(issue,null,2)} onChange={e=>setIssue(JSON.parse(e.target.value))} style={{width:'100%',height:110,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
