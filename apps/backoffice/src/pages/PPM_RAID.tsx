import React, { useEffect, useState } from 'react';

export default function PPM_RAID(){
  const [status,setStatus]=useState({initiativeId:'INIT-1',period:new Date().toISOString().slice(0,7),rag:'amber',progress_pct:25,blockers:['hiring'],notes:'On track after hire'});
  const [risk,setRisk]=useState({initiativeId:'INIT-1',riskId:'R-1',severity:'high',impact:'timeline slip',prob:'med',owner:'pm',mitigations:'parallel work',status:'open'});
  const [deps,setDeps]=useState({edges:[{from:'INIT-1',to:'INIT-2',type:'blocks',notes:'Requires API'}]});
  const [recent,setRecent]=useState<any>({});
  const upd=async()=>{ await fetch('/api/ppm/status/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(status)}); await load(); };
  const log=async()=>{ await fetch('/api/ppm/risks/log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(risk)}); };
  const depset=async()=>{ await fetch('/api/ppm/deps/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(deps)}); };
  const load=async()=>{ const j=await (await fetch('/api/ppm/status/recent?initiativeId=INIT-1')).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>RAID & Status</h2>
    <div><button onClick={upd}>Update Status</button><button onClick={log} style={{marginLeft:8}}>Log Risk</button><button onClick={depset} style={{marginLeft:8}}>Set Dependencies</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <textarea value={JSON.stringify(status,null,2)} onChange={e=>setStatus(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(risk,null,2)} onChange={e=>setRisk(JSON.parse(e.target.value))} style={{width:'100%',height:110,marginTop:8}}/>
    <textarea value={JSON.stringify(deps,null,2)} onChange={e=>setDeps(JSON.parse(e.target.value))} style={{width:'100%',height:110,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
