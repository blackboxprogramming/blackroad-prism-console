import React, { useEffect, useState } from 'react';

export default function Change_Calendar(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7)); const [form,setForm]=useState('{"period":"'+new Date().toISOString().slice(0,7)+'","freezes":[{"start":"2025-09-25","end":"2025-09-27","scope":"all"}],"maint_windows":[{"start":"2025-09-20T02:00:00Z","end":"2025-09-20T04:00:00Z","env":"prod"}]}'); const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/change/calendar/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:form}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/change/calendar/${period}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Change Calendar</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><button onClick={save} style={{marginLeft:8}}>Save</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
