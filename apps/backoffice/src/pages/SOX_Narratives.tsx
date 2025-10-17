import React, { useState } from 'react';

export default function SOX_Narratives(){
  const [processId,setProcessId]=useState('OrderToCash'); const [title,setTitle]=useState('O2C Narrative');
  const [md,setMd]=useState('# Narrative\n\nDescribe actors, systems, and data flows.\n');
  const save=async()=>{ await fetch('/api/sox/narrative/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({processId,title,md})}); alert('Saved'); };
  const load=async()=>{ const t=await (await fetch(`/api/sox/narrative/${processId}`)).text(); setMd(t); };
  return <section><h2>Narratives & Walkthroughs</h2>
    <div><input value={processId} onChange={e=>setProcessId(e.target.value)}/><input value={title} onChange={e=>setTitle(e.target.value)} style={{marginLeft:8}}/><button onClick={save} style={{marginLeft:8}}>Save</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <textarea value={md} onChange={e=>setMd(e.target.value)} style={{width:'100%',height:260,marginTop:8}}/>
  </section>;
}
