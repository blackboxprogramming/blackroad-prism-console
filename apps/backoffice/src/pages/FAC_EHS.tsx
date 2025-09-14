import React, { useEffect, useState } from 'react';

export default function FAC_EHS(){
  const [incident,setIncident]=useState({incidentId:'i-1',locationId:'hq',reporterId:'u1',category:'near_miss',severity:'low',description:'Slippery floor',date:'2025-09-18'});
  const [inspection,setInspection]=useState({inspectionId:'insp-1',locationId:'hq',inspectorId:'u2',checklist:{items:['Exits clear','Spill kits available']},findings:['Wet corridor'],actions:['Clean up']});
  const [action,setAction]=useState({incidentId:'i-1',actionId:'a-1',owner:'facops',due:'2025-09-21',status:'open',notes:'Assign to vendor'});
  const [recent,setRecent]=useState<any>({});
  const logI=async()=>{ await fetch('/api/fac/ehs/incident',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(incident)}); await load(); };
  const logS=async()=>{ await fetch('/api/fac/ehs/inspection',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(inspection)}); await load(); };
  const logA=async()=>{ await fetch('/api/fac/ehs/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action)}); };
  const load=async()=>{ const j=await (await fetch('/api/fac/ehs/recent?locationId=hq')).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>EHS</h2>
    <div><button onClick={logI}>Log Incident</button><button onClick={logS} style={{marginLeft:8}}>Log Inspection</button><button onClick={logA} style={{marginLeft:8}}>Add Action</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <textarea value={JSON.stringify(incident,null,2)} onChange={e=>setIncident(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(inspection,null,2)} onChange={e=>setInspection(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(action,null,2)} onChange={e=>setAction(JSON.parse(e.target.value))} style={{width:'100%',height:110,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
