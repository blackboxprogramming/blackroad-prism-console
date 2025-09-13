import React, { useState } from 'react';

export default function ReleaseTrain(){
  const [train,setTrain]=useState('2025.09-train'); const [version,setVersion]=useState('1.4.0');
  const run=()=>{ alert(`Run GitHub workflow "Product Release Train" with train=${train} version=${version}`); };
  const addEntry=async()=>{ const entry=prompt('Changelog entry?')||''; await fetch('/api/product/changelog/append',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version,entry})}); alert('Added'); };
  const view=async()=>{ const t=await (await fetch('/api/product/changelog')).text(); const w=window.open('about:blank','_blank'); if(w) w.document.write(`<pre>${t.replace(/[<&>]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</pre>`); };
  return <section><h2>Release Train</h2>
    <div><input value={train} onChange={e=>setTrain(e.target.value)}/><input value={version} onChange={e=>setVersion(e.target.value)} style={{marginLeft:8}}/>
      <button onClick={run} style={{marginLeft:8}}>Prepare Release</button>
      <button onClick={addEntry} style={{marginLeft:8}}>Append Changelog</button>
      <button onClick={view} style={{marginLeft:8}}>View Changelog</button></div>
  </section>;
}
