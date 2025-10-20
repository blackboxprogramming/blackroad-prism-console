import React, { useEffect, useState } from 'react';

export default function OBS_Runbooks(){
  const [service,setService]=useState('api'); const [md,setMd]=useState('# Runbook\n\n- Step 1: Check logs\n- Step 2: Roll back\n'); const [txt,setTxt]=useState('');
  const save=async()=>{ const j=await (await fetch('/api/obs/runbooks/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({service,md})})).json(); alert(j.file); };
  const view=async()=>{ const t=await (await fetch(`/api/obs/runbooks/${service}`)).text(); setTxt(t); };
  useEffect(()=>{},[]);
  return <section><h2>Runbooks</h2>
    <div><input value={service} onChange={e=>setService(e.target.value)}/><button onClick={save} style={{marginLeft:8}}>Save</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{txt}</pre>
  </section>;
}
