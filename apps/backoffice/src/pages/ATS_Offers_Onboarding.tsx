import React, { useEffect, useState } from 'react';

export default function ATS_Offers_Onboarding(){
  const [offer,setOffer]=useState({offerId:'OF-1',appId:'APP-1',comp:{base:180000,bonus:10,equity:'0.1%'},level:'L5',start_date:'2025-10-15',notes:'Sign-on $5k'});
  const [ostate,setOState]=useState({offerId:'OF-1',state:'sent'});
  const [bg,setBg]=useState({checkId:'BG-1',appId:'APP-1',package:'standard',provider:'stub',consent:true});
  const [bgst,setBgst]=useState({checkId:'BG-1',status:'clear'});
  const [ob,setOb]=useState({appId:'APP-1',tasks:[{id:'t1',title:'Create IAM account',owner:'IT',target_system:'IAM',due:'2025-10-10',status:'open'},{id:'t2',title:'Assign Security Awareness',owner:'HR',target_system:'LMS',due:'2025-10-12',status:'open'}]});
  const [status,setStatus]=useState<any>({});
  const createOffer=async()=>{ await fetch('/api/ats/offers/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(offer)}); };
  const changeOffer=async()=>{ await fetch('/api/ats/offers/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(ostate)}); };
  const startBG=async()=>{ await fetch('/api/ats/background/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(bg)}); };
  const setBG=async()=>{ await fetch('/api/ats/background/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(bgst)}); };
  const setTasks=async()=>{ await fetch('/api/ats/onboarding/tasks/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(ob)}); await load(); };
  const complete=async()=>{ await fetch('/api/ats/onboarding/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({appId:'APP-1',taskId:'t1'})}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/ats/onboarding/status?appId=APP-1')).json(); setStatus(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Offers, Background & Onboarding</h2>
    <div><button onClick={createOffer}>Create Offer</button><button onClick={changeOffer} style={{marginLeft:8}}>Set Offer State</button><button onClick={startBG} style={{marginLeft:8}}>Start BG</button><button onClick={setBG} style={{marginLeft:8}}>Set BG Status</button><button onClick={setTasks} style={{marginLeft:8}}>Set Tasks</button><button onClick={complete} style={{marginLeft:8}}>Complete Task</button></div>
    <textarea value={JSON.stringify(offer,null,2)} onChange={e=>setOffer(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(ostate,null,2)} onChange={e=>setOState(JSON.parse(e.target.value))} style={{width:'100%',height:90,marginTop:8}}/>
    <textarea value={JSON.stringify(bg,null,2)} onChange={e=>setBg(JSON.parse(e.target.value))} style={{width:'100%',height:100,marginTop:8}}/>
    <textarea value={JSON.stringify(bgst,null,2)} onChange={e=>setBgst(JSON.parse(e.target.value))} style={{width:'100%',height:90,marginTop:8}}/>
    <textarea value={JSON.stringify(ob,null,2)} onChange={e=>setOb(JSON.parse(e.target.value))} style={{width:'100%',height:150,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(status,null,2)}</pre>
  </section>;
}
