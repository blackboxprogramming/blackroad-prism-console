import React, { useEffect, useState } from 'react';

export default function ATS_Reports(){
  const [latest,setLatest]=useState<string|null>(null);
  const gen=async(type:string)=>{ const period=new Date().toISOString().slice(0,7); const j=await (await fetch('/api/ats/report/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period,type})})).json(); setLatest(j.file); };
  const showLatest=async()=>{ const j=await (await fetch('/api/ats/report/latest')).json(); setLatest(j.latest); };
  useEffect(()=>{ showLatest(); },[]);
  return <section><h2>ATS Reports</h2>
    <div><button onClick={()=>gen('pipeline')}>Pipeline</button><button onClick={()=>gen('ttf')} style={{marginLeft:8}}>Time to Fill</button><button onClick={()=>gen('dei')} style={{marginLeft:8}}>DEI</button><button onClick={showLatest} style={{marginLeft:8}}>Latest</button></div>
    <div style={{marginTop:8}}>Latest: <code>{latest||'none'}</code></div>
  </section>;
}
