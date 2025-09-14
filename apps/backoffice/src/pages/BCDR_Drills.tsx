import React, { useEffect, useState } from 'react';

export default function BCDR_Drills(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7));
  const [cal,setCal]=useState('{"period":"'+new Date().toISOString().slice(0,7)+'","drills":[{"id":"DR-1","date":"'+new Date().toISOString().slice(0,10)+'","type":"tabletop","scope":"service","owner":"csm"}]}');
  const save=async()=>{ await fetch('/api/bcdr/drill/schedule',{method:'POST',headers:{'Content-Type':'application/json'},body:cal}); };
  const log=async()=>{ const id=prompt('Drill ID?')||'DR-1'; const outcome=prompt('Outcome (pass|fail)?','pass')||'pass'; await fetch('/api/bcdr/drill/log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,date:new Date().toISOString().slice(0,10),outcome,issues:[]})}); };
  const recent=async()=>{ const j=await (await fetch(`/api/bcdr/drill/recent?period=${period}`)).json(); alert(JSON.stringify(j)); };
  useEffect(()=>{},[]);
  return <section><h2>Drill Calendar & Logs</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><button onClick={save} style={{marginLeft:8}}>Save Calendar</button><button onClick={log} style={{marginLeft:8}}>Log Drill</button><button onClick={recent} style={{marginLeft:8}}>Recent</button></div>
    <textarea value={cal} onChange={e=>setCal(e.target.value)} style={{width:'100%',height:140,marginTop:8}}/>
  </section>;
}
