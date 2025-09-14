import React, { useEffect, useState } from 'react';

export default function TPRM_Monitor_SLA(){
  const [mon,setMon]=useState({vendorId:'vend-1',monitors:[{type:'breach_feed',config:{}}]});
  const [event,setEvent]=useState({vendorId:'vend-1',type:'breach_feed',detail:{headline:'Reported incident'}});
  const [sla,setSla]=useState({vendorId:'vend-1',metrics:{availability:99.9},targets:{availability:99.9}});
  const [recent,setRecent]=useState<any>({});
  const upsert=async()=>{ await fetch('/api/tprm/monitor/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(mon)}); };
  const push=async()=>{ await fetch('/api/tprm/monitor/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(event)}); await load(); };
  const setTarget=async()=>{ await fetch('/api/tprm/sla/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sla)}); };
  const load=async()=>{ const j=await (await fetch('/api/tprm/monitor/recent?vendorId=vend-1')).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Monitoring & SLA</h2>
    <div><button onClick={upsert}>Upsert Monitors</button><button onClick={push} style={{marginLeft:8}}>Add Event</button><button onClick={setTarget} style={{marginLeft:8}}>Set SLA</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <textarea value={JSON.stringify(mon,null,2)} onChange={e=>setMon(JSON.parse(e.target.value))} style={{width:'100%',height:100,marginTop:8}}/>
    <textarea value={JSON.stringify(sla,null,2)} onChange={e=>setSla(JSON.parse(e.target.value))} style={{width:'100%',height:90,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
