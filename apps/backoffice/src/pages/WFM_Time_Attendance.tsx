import React, { useEffect, useState } from 'react';

export default function WFM_Time_Attendance(){
  const [punchIn,setIn]=useState({subjectId:'u1',type:'in',ts:Date.now(),shift_code:'STD'});
  const [punchOut,setOut]=useState({subjectId:'u1',type:'out',ts:Date.now()+4*3600000});
  const [sheet,setSheet]=useState({subjectId:'u1',period:new Date().toISOString().slice(0,7),lines:[{date:new Date().toISOString().slice(0,10),hours:8,cost_center:'ENG'}]});
  const [view,setView]=useState<any>({});
  const pin=async()=>{ await fetch('/api/wfm/clock/punch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(punchIn)}); await load(); };
  const pout=async()=>{ await fetch('/api/wfm/clock/punch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(punchOut)}); await load(); };
  const submit=async()=>{ await fetch('/api/wfm/timesheets/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sheet)}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/wfm/time/recent?subjectId=u1')).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Time & Attendance</h2>
    <div><button onClick={pin}>Clock In</button><button onClick={pout} style={{marginLeft:8}}>Clock Out</button><button onClick={submit} style={{marginLeft:8}}>Submit Timesheet</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <textarea value={JSON.stringify(punchIn,null,2)} onChange={e=>setIn(JSON.parse(e.target.value))} style={{width:'100%',height:110,marginTop:8}}/>
    <textarea value={JSON.stringify(punchOut,null,2)} onChange={e=>setOut(JSON.parse(e.target.value))} style={{width:'100%',height:110,marginTop:8}}/>
    <textarea value={JSON.stringify(sheet,null,2)} onChange={e=>setSheet(JSON.parse(e.target.value))} style={{width:'100%',height:130,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>
  </section>;
}
