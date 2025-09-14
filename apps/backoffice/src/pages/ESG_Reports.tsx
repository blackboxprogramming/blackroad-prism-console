import React, { useEffect, useState } from 'react';

export default function ESG_Reports(){
  const [file,setFile]=useState<string|null>(null);
  const gen=async()=>{ const year=new Date().getFullYear().toString(); const j=await (await fetch('/api/esg/report/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({year,standard:'GHG',include_scopes:['S1','S2','S3']})})).json(); setFile(j.file); };
  const latest=async()=>{ const j=await (await fetch('/api/esg/report/latest')).json(); setFile(j.latest); };
  useEffect(()=>{ latest(); },[]);
  return <section><h2>ESG Reports</h2>
    <div><button onClick={gen}>Generate Annual</button><button onClick={latest} style={{marginLeft:8}}>Latest</button></div>
    <div style={{marginTop:8}}>Latest: <code>{file||'none'}</code></div>
  </section>;
}
