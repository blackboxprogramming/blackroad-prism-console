
import React, { useEffect, useState } from 'react';

export default function CRM_Territory_Quota(){
  const [rules,setRules]=useState('[{"name":"NA-Enterprise","regions":["NA"],"industries":["Tech"],"owner":"rep1"}]');
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7)); const [reps,setReps]=useState('[{"userId":"rep1","quota":500000},{"userId":"rep2","quota":300000}]'); const [view,setView]=useState<any>(null);
  const saveRules=async()=>{ await fetch('/api/crm/territories/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rules:JSON.parse(rules)})}); };
  const setQuotas=async()=>{ await fetch('/api/crm/quotas/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period,reps:JSON.parse(reps)})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/crm/quotas/${period}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Territories & Quotas</h2>
    <div><textarea value={rules} onChange={e=>setRules(e.target.value)} style={{width:'100%',height:120}}/></div>
    <div style={{marginTop:8}}><input value={period} onChange={e=>setPeriod(e.target.value)}/><textarea value={reps} onChange={e=>setReps(e.target.value)} style={{width:'100%',height:100,marginTop:8}}/><button onClick={saveRules} style={{marginTop:8}}>Save Rules</button><button onClick={setQuotas} style={{marginLeft:8}}>Set Quotas</button><button onClick={load} style={{marginLeft:8}}>Load Quotas</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}

