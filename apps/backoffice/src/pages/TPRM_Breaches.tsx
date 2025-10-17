import React, { useEffect, useState } from 'react';

export default function TPRM_Breaches(){
  const [report,setReport]=useState({vendorId:'vend-1',incidentId:'inc-1',summary:'Incident summary',date:'2025-09-10',impact:'minor',actions:['notify','investigate']});
  const [recent,setRecent]=useState<any>({});
  const send=async()=>{ await fetch('/api/tprm/breach/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/tprm/breach/recent?vendorId=vend-1')).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Breach Notifications</h2>
    <div><button onClick={send}>Report</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <textarea value={JSON.stringify(report,null,2)} onChange={e=>setReport(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
