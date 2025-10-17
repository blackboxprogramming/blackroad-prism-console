import React, { useEffect, useState } from 'react';

export default function PORTAL_Banners(){
  const [b,setB]=useState({key:'site-maint',html:'<strong>Maintenance Fri 9pm CT</strong>',active:true,audience:{dept:'ALL'},start:new Date().toISOString(),end:''});
  const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/portal/banners/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/portal/banners/${b.key}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Banners & Notices</h2>
    <div><input value={b.key} onChange={e=>setB({...b,key:e.target.value})}/><button onClick={save} style={{marginLeft:8}}>Save</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <textarea value={JSON.stringify(b,null,2)} onChange={e=>setB(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
