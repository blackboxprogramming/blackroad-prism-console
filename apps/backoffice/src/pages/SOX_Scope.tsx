import React, { useEffect, useState } from 'react';

export default function SOX_Scope(){
  const [year,setYear]=useState('2025'); const [scope,setScope]=useState<any>({processes:['OrderToCash','ProcureToPay'],key_controls:['C1','C2']}); const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/sox/scope/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({year,processes:scope.processes,key_controls:scope.key_controls})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/sox/scope/${year}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>SOX Scope & Calendar</h2>
    <div><input value={year} onChange={e=>setYear(e.target.value)}/><button onClick={save} style={{marginLeft:8}}>Save</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
