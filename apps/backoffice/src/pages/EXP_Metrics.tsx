import React, { useEffect, useState } from 'react';

export default function EXP_Metrics(){
  const [metric,setMetric]=useState({metric:'signup',type:'bin',window:'14d'});
  const [assignBody,setAssign]=useState('{"expId":"exp-new-ui","subject":{"id":"u1","attrs":{"country":"US"}}}');
  const [exposure,setExposure]=useState('{"expId":"exp-new-ui","subjectId":"u1","variant":"treatment"}');
  const [convert,setConvert]=useState('{"metric":"signup","subjectId":"u1","value":1,"expId":"exp-new-ui","variant":"treatment"}');
  const [results,setResults]=useState<any>({});
  const reg=async()=>{ await fetch('/api/exp/metrics/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(metric)}); };
  const assign=async()=>{ const j=await (await fetch('/api/exp/assign',{method:'POST',headers:{'Content-Type':'application/json'},body:assignBody})).json(); alert(JSON.stringify(j)); };
  const expose=async()=>{ await fetch('/api/exp/exposure',{method:'POST',headers:{'Content-Type':'application/json'},body:exposure}); };
  const conv=async()=>{ await fetch('/api/exp/convert',{method:'POST',headers:{'Content-Type':'application/json'},body:convert}); };
  const analyze=async()=>{ const j=await (await fetch('/api/exp/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expId:'exp-new-ui',method:'bayes',horizon_days:14})})).json(); setResults(j); };
  useEffect(()=>{},[]);
  return <section><h2>Metrics & Analysis</h2>
    <div><button onClick={reg}>Register Metric</button><button onClick={assign} style={{marginLeft:8}}>Assign</button><button onClick={expose} style={{marginLeft:8}}>Exposure</button><button onClick={conv} style={{marginLeft:8}}>Convert</button><button onClick={analyze} style={{marginLeft:8}}>Analyze</button></div>
    <textarea value={assignBody} onChange={e=>setAssign(e.target.value)} style={{width:'100%',height:90,marginTop:8}}/>
    <textarea value={exposure} onChange={e=>setExposure(e.target.value)} style={{width:'100%',height:90,marginTop:8}}/>
    <textarea value={convert} onChange={e=>setConvert(e.target.value)} style={{width:'100%',height:90,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(results,null,2)}</pre>
  </section>;
}
