import React, { useEffect, useState } from 'react';

export default function EXP_Ramps(){
  const [expId,setExpId]=useState('exp-new-ui'); const [schedule,setSchedule]=useState('[{"at":"2025-09-20T00:00:00Z","variant":"treatment","pct":10},{"at":"2025-09-27T00:00:00Z","variant":"treatment","pct":50}]');
  const [view,setView]=useState<any>({});
  const setRamp=async()=>{ await fetch('/api/exp/ramp/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expId,schedule:JSON.parse(schedule)})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/exp/ramp/${expId}`)).json(); setView(j); };
  const guard=async()=>{ const j=await (await fetch('/api/exp/guardrails/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expId})})).json(); alert(JSON.stringify(j)); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Ramps & Guardrails</h2>
    <div><input value={expId} onChange={e=>setExpId(e.target.value)}/><button onClick={setRamp} style={{marginLeft:8}}>Set Ramp</button><button onClick={guard} style={{marginLeft:8}}>Check Guardrails</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <textarea value={schedule} onChange={e=>setSchedule(e.target.value)} style={{width:'100%',height:120,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>
  </section>;
}
