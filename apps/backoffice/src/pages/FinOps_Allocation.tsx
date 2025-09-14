import React, { useEffect, useState } from 'react';

export default function FinOps_Allocation(){
  const [rules,setRules]=useState('{"rules":[{"match":{"project":"core","env":"prod"},"map":{"cost_center":"ENG","product":"Platform","owner":"platform"}}]}'); const [period,setPeriod]=useState(new Date().toISOString().slice(0,7));
  const save=async()=>{ await fetch('/api/finops/allocation/rules/set',{method:'POST',headers:{'Content-Type':'application/json'},body:rules}); };
  const run=async()=>{ await fetch('/api/finops/allocation/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period})}); };
  const snap=async()=>{ const j=await (await fetch(`/api/finops/allocation/snapshot?period=${period}`)).json(); alert(JSON.stringify(j)); };
  useEffect(()=>{},[]);
  return <section><h2>Allocation (Showback/Chargeback)</h2>
    <textarea value={rules} onChange={e=>setRules(e.target.value)} style={{width:'100%',height:140}}/><div><button onClick={save}>Save Rules</button><input value={period} onChange={e=>setPeriod(e.target.value)} style={{marginLeft:8}}/><button onClick={run} style={{marginLeft:8}}>Run</button><button onClick={snap} style={{marginLeft:8}}>Snapshot</button></div>
  </section>;
}
