import React, { useEffect, useState } from 'react';

export default function OBS_Alerts(){
  const [cfg,setCfg]=useState('{"rules":[{"id":"latency-high","service":"api","expr":"latency_p95>250","threshold":250,"for_s":60,"severity":"page","route":"pagerduty"},{"id":"availability-low","service":"api","expr":"availability<99.9","threshold":99.9,"for_s":120,"severity":"ticket","route":"slack"}]}');
  const [period,setPeriod]=useState('2025-09-01..2025-09-30'); const [recent,setRecent]=useState<any>({});
  const save=async()=>{ await fetch('/api/obs/alerts/set',{method:'POST',headers:{'Content-Type':'application/json'},body:cfg}); };
  const run=async()=>{ await fetch('/api/obs/alerts/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period})}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/obs/alerts/recent')).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Alerts & Routing</h2>
    <textarea value={cfg} onChange={e=>setCfg(e.target.value)} style={{width:'100%',height:140}}/><div><button onClick={save}>Save</button><input value={period} onChange={e=>setPeriod(e.target.value)} style={{marginLeft:8}}/><button onClick={run} style={{marginLeft:8}}>Run</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
