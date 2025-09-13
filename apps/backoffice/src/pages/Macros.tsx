import React, { useState } from 'react';

export default function Macros(){
  const [id,setId]=useState(''); const [macro,setMacro]=useState('acknowledge');
  const run=async()=>{ await fetch('/api/support/macros/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,macro})}); alert('OK'); };
  return <section><h2>Macros</h2>
    <input placeholder="Ticket ID" value={id} onChange={e=>setId(e.target.value)}/>
    <select value={macro} onChange={e=>setMacro(e.target.value)} style={{marginLeft:8}}><option>acknowledge</option><option>request_logs</option><option>close_resolved</option></select>
    <button onClick={run} style={{marginLeft:8}}>Run Macro</button>
  </section>;
}
