import React, { useEffect, useState } from 'react';

export default function ESG_Reports(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7)); const [standard,setStandard]=useState('GRI'); const [latest,setLatest]=useState<string|null>(null);
  const publish=async()=>{ const j=await (await fetch('/api/esg/report/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({standard,period})})).json(); alert(j.file); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/esg/reports/latest')).json(); setLatest(j.latest||null); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>ESG Reports</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><select value={standard} onChange={e=>setStandard(e.target.value)} style={{marginLeft:8}}><option>GRI</option><option>SASB</option><option>CSRD</option></select><button onClick={publish} style={{marginLeft:8}}>Publish</button></div>
    <div style={{marginTop:8}}>Latest: <code>{latest||'none'}</code></div>
  </section>;
}
