import React, { useEffect, useState } from 'react';

export default function OBS_SLOs(){
  const [def,setDef]=useState('{"service":"api","sloId":"availability-slo","objective":99.9,"window":"30d","indicator":"availability","targets":{"availability":99.9}}');
  const [period,setPeriod]=useState('2025-09-01..2025-09-30'); const [service,setService]=useState('api'); const [snap,setSnap]=useState<any>({});
  const save=async()=>{ await fetch('/api/obs/slo/set',{method:'POST',headers:{'Content-Type':'application/json'},body:def}); };
  const evalS=async()=>{ const j=await (await fetch('/api/obs/slo/evaluate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({service,period})})).json(); setSnap(j.snapshot||{}); };
  const view=async()=>{ const j=await (await fetch(`/api/obs/slo/snapshot?service=${service}`)).json(); setSnap(j); };
  useEffect(()=>{ view(); },[]);
  return <section><h2>SLOs & Error Budgets</h2>
    <textarea value={def} onChange={e=>setDef(e.target.value)} style={{width:'100%',height:140}}/><div><button onClick={save}>Save</button><input value={period} onChange={e=>setPeriod(e.target.value)} style={{marginLeft:8}}/><button onClick={evalS} style={{marginLeft:8}}>Evaluate</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(snap,null,2)}</pre>
  </section>;
}
