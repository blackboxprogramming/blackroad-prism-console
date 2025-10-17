import React, { useEffect, useState } from 'react';

export default function SOX_Tests(){
  const [controlId,setControlId]=useState('C1'); const [period,setPeriod]=useState('2025Q3'); const [items,setItems]=useState<any[]>([]);
  const create=async()=>{ const type='TOD'; const procedure='Review cutoff schedule'; const sample='3 transactions'; await fetch('/api/sox/tests/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({controlId,type,period,procedure,sample})}); await load(); };
  const result=async()=>{ const testId=prompt('test id?')||''; await fetch('/api/sox/tests/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({testId,result:'pass',exceptions:[]})}); await load(); };
  const evidence=async()=>{ const testId=prompt('test id?')||''; const ref=prompt('evidence ref (url/path)?')||''; await fetch('/api/sox/evidence/attach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({testId,ref,note:'attached'})}); };
  const sign=async()=>{ const testId=prompt('test id?')||''; await fetch('/api/sox/signoff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({testId,approver:'Controller',role:'Management'})}); };
  const load=async()=>{ const j=await (await fetch(`/api/sox/tests/recent?controlId=${controlId}&period=${period}`)).json(); setItems(j.items||[]); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Testing (TOD/TOE)</h2>
    <div><input value={controlId} onChange={e=>setControlId(e.target.value)}/><input value={period} onChange={e=>setPeriod(e.target.value)} style={{marginLeft:8}}/>
      <button onClick={create} style={{marginLeft:8}}>Create Test</button><button onClick={result} style={{marginLeft:8}}>Set Result</button><button onClick={evidence} style={{marginLeft:8}}>Attach Evidence</button><button onClick={sign} style={{marginLeft:8}}>Sign-off</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(items,null,2)}</pre>
  </section>;
}
