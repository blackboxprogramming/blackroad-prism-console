import React, { useState } from 'react';

export default function CMDB_Baseline(){
  const [ciId,setCiId]=useState('svc-api'); const [baseline,setBaseline]=useState('{"attrs":{"tier":"gold","replicas":3},"rels":[{"type":"runs_on","to":"host-1"}]}'); const [out,setOut]=useState<any>(null);
  const setB=async()=>{ await fetch('/api/cmdb/baseline/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ciId,baseline:JSON.parse(baseline)})}); };
  const scan=async()=>{ const j=await (await fetch('/api/cmdb/drift/scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ciId})})).json(); setOut(j); };
  const recent=async()=>{ const j=await (await fetch(`/api/cmdb/drift/recent?ciId=${ciId}`)).json(); setOut(j); };
  return <section><h2>Baselines & Drift</h2>
    <div><input value={ciId} onChange={e=>setCiId(e.target.value)}/><button onClick={setB} style={{marginLeft:8}}>Set Baseline</button><button onClick={scan} style={{marginLeft:8}}>Scan Drift</button><button onClick={recent} style={{marginLeft:8}}>Recent</button></div>
    {out && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(out,null,2)}</pre>}
  </section>;
}
