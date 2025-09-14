import React, { useEffect, useState } from 'react';

export default function BCDR_Plans(){
  const [key,setKey]=useState('bcp-api'); const [md,setMd]=useState('# BCP for API\n\n- Contacts\n- Steps\n- Dependencies'); const [txt,setTxt]=useState('');
  const save=async()=>{ const j=await (await fetch('/api/bcdr/plan/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,md})})).json(); alert(j.file); };
  const view=async()=>{ const t=await (await fetch(`/api/bcdr/plan/${key}`)).text(); setTxt(t); };
  useEffect(()=>{},[]);
  return <section><h2>BCP Runbooks</h2>
    <div><input value={key} onChange={e=>setKey(e.target.value)}/><button onClick={save} style={{marginLeft:8}}>Save</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{txt}</pre>
  </section>;
}
