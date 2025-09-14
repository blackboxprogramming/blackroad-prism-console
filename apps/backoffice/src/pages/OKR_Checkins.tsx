import React, { useEffect, useState } from 'react';

export default function OKR_Checkins(){
  const [check,setCheck]=useState({objectiveId:'OBJ-1',period:'2025-Q4',score:0.7,confidence:'med',kr_updates:[{krId:'KR-1',progress:0.6,comment:'CSAT trending up'}],risks:['staffing']});
  const [summary,setSummary]=useState<any>({});
  const submit=async()=>{ await fetch('/api/okr/checkin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(check)}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/okr/summary?period=2025-Q4')).json(); setSummary(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Check-ins</h2>
    <div><button onClick={submit}>Submit Check-in</button><button onClick={load} style={{marginLeft:8}}>Load Summary</button></div>
    <textarea value={JSON.stringify(check,null,2)} onChange={e=>setCheck(JSON.parse(e.target.value))} style={{width:'100%',height:140,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(summary,null,2)}</pre>
  </section>;
}
