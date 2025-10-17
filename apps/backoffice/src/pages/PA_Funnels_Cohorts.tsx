import React, { useEffect, useState } from 'react';

export default function PA_Funnels_Cohorts(){
  const [funnel,setFunnel]=useState({funnelId:'signup',name:'Signup Funnel',steps:[{event:'App Launched'},{event:'Signup'}],window_days:14});
  const [cohort,setCohort]=useState({id:'pro-users',name:'Pro Users',rule:{kind:'trait',key:'plan',op:'eq',value:'pro'}});
  const [ret,setRet]=useState({anchor_event:'App Launched',return_event:'Signup',window_days:14,period:new Date().toISOString().slice(0,7)});
  const [counts,setCounts]=useState<any>({}); const [cv,setCv]=useState<any>({}); const [rv,setRv]=useState<any>({});
  const saveF=async()=>{ await fetch('/api/pa/funnel/define',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(funnel)}); };
  const runF=async()=>{ const j=await (await fetch('/api/pa/funnel/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({funnelId:funnel.funnelId,period:new Date().toISOString().slice(0,7)})})).json(); setCounts(j); };
  const saveC=async()=>{ await fetch('/api/pa/cohorts/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(cohort)}); const g=await (await fetch('/api/pa/cohorts/pro-users')).json(); setCv(g); };
  const runR=async()=>{ const j=await (await fetch('/api/pa/retention/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(ret)})).json(); setRv(j); };
  useEffect(()=>{},[]);
  return <section><h2>PA: Funnels, Cohorts & Retention</h2>
    <div><button onClick={saveF}>Save Funnel</button><button onClick={runF} style={{marginLeft:8}}>Run Funnel</button><button onClick={saveC} style={{marginLeft:8}}>Save Cohort</button><button onClick={runR} style={{marginLeft:8}}>Run Retention</button></div>
    <textarea value={JSON.stringify(funnel,null,2)} onChange={e=>setFunnel(JSON.parse(e.target.value))} style={{width:'100%',height:150,marginTop:8}}/>
    <textarea value={JSON.stringify(cohort,null,2)} onChange={e=>setCohort(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(ret,null,2)} onChange={e=>setRet(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <h4>Funnel</h4><pre style={{background:'#f7f7f7',padding:8}}>{JSON.stringify(counts,null,2)}</pre>
    <h4>Cohort</h4><pre style={{background:'#f7f7f7',padding:8}}>{JSON.stringify(cv,null,2)}</pre>
    <h4>Retention</h4><pre style={{background:'#f7f7f7',padding:8}}>{JSON.stringify(rv,null,2)}</pre>
  </section>;
}
