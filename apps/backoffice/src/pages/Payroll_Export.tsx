import React, { useState } from 'react';

export default function Payroll_Export(){
  const [runId,setRunId]=useState('RUN-1'); const [mode,setMode]=useState<'ach'|'csv'|'journal'>('ach');
  const exportRun=async()=>{ const j=await (await fetch('/api/payroll/run/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId,mode})})).json(); alert(JSON.stringify(j)); };
  return <section><h2>Export (ACH/CSV/GL)</h2>
    <div><input value={runId} onChange={e=>setRunId(e.target.value)}/><select value={mode} onChange={e=>setMode(e.target.value as any)} style={{marginLeft:8}}><option>ach</option><option>csv</option><option>journal</option></select><button onClick={exportRun} style={{marginLeft:8}}>Export</button></div>
  </section>;
}

