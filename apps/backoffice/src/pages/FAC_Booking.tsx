import React, { useEffect, useState } from 'react';

export default function FAC_Booking(){
  const [createBody,setCreate]=useState({bookingId:'b-1',spaceId:'hq-rm101',subjectId:'u1',start:'2025-09-20T15:00:00Z',end:'2025-09-20T16:00:00Z',purpose:'1:1',required_checkin_min:10});
  const [checkinBody,setCheckin]=useState({bookingId:'b-1',subjectId:'u1'});
  const [stateBody,setState]=useState({bookingId:'b-1',state:'cancelled'});
  const [recent,setRecent]=useState<any>({});
  const make=async()=>{ const j=await (await fetch('/api/fac/bookings/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(createBody)})).json(); alert(JSON.stringify(j)); await load(); };
  const check=async()=>{ await fetch('/api/fac/bookings/checkin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(checkinBody)}); };
  const change=async()=>{ await fetch('/api/fac/bookings/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(stateBody)}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/fac/bookings/recent?spaceId=hq-rm101')).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Bookings</h2>
    <div><button onClick={make}>Create</button><button onClick={check} style={{marginLeft:8}}>Check-in</button><button onClick={change} style={{marginLeft:8}}>Change State</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <textarea value={JSON.stringify(createBody,null,2)} onChange={e=>setCreate(JSON.parse(e.target.value))} style={{width:'100%',height:140,marginTop:8}}/>
    <textarea value={JSON.stringify(checkinBody,null,2)} onChange={e=>setCheckin(JSON.parse(e.target.value))} style={{width:'100%',height:90,marginTop:8}}/>
    <textarea value={JSON.stringify(stateBody,null,2)} onChange={e=>setState(JSON.parse(e.target.value))} style={{width:'100%',height:90,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
