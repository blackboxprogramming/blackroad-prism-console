
import React, { useEffect, useState } from 'react';

export default function DEV_Docs(){
  const [api,setApi]=useState('ledger'); const [md,setMd]=useState('# Ledger API\nGET /balances'); const [txt,setTxt]=useState('');
  const publish=async()=>{ await fetch('/api/dev/docs/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({api,markdown:md})}); await load(); };
  const load=async()=>{ const t=await (await fetch(`/api/dev/docs/${api}`)).text(); setTxt(t); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Docs & SDKs</h2>
    <div><input value={api} onChange={e=>setApi(e.target.value)}/><button onClick={publish} style={{marginLeft:8}}>Publish</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{txt}</pre>
  </section>;
}
