import React, { useEffect, useState } from 'react';

export default function AIOPS_Monitor(){
  const [env,setEnv]=useState('prod'); const [payload,setPayload]=useState('{"env":"prod","metrics":{"latency_p95":350,"error_rate":0.02},"drift":{"psi":0.05},"fairness":{"metric":"demographic_parity","value":0.92}}');
  const [recent,setRecent]=useState<any>({});
  const ingest=async()=>{ await fetch('/api/aiops/monitor/ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:payload}); await load(); };
  const alert=async()=>{ await fetch('/api/aiops/monitor/alert/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period:new Date().toISOString().slice(0,7)})}); };
  const load=async()=>{ const j=await (await fetch(`/api/aiops/monitor/recent?env=${env}`)).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Monitoring & Alerts</h2>
    <textarea value={payload} onChange={e=>setPayload(e.target.value)} style={{width:'100%',height:140}}/><div><input value={env} onChange={e=>setEnv(e.target.value)}/><button onClick={ingest} style={{marginLeft:8}}>Ingest</button><button onClick={alert} style={{marginLeft:8}}>Run Alerts</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
