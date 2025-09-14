import React, { useEffect, useState } from 'react';

export default function EXP_Experiments(){
  const [exp,setExp]=useState({expId:'exp-new-ui',name:'New UI A/B',feature_key:'new_ui',variants:[{name:'control',weight:1},{name:'treatment',weight:1}],segment:'all',metrics:{primary:'signup'},guardrails:{err_rate_max:0.05,latency_p95_ms_max:800},owner:'growth',hypothesis:'New UI increases signup rate'});
  const [state,setState]=useState({expId:'exp-new-ui',state:'running'}); const [view,setView]=useState<any>(null);
  const create=async()=>{ await fetch('/api/exp/experiments/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(exp)}); await load(); };
  const setSt=async()=>{ await fetch('/api/exp/experiments/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/exp/experiments/${exp.expId}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Experiments</h2>
    <div><button onClick={create}>Create</button><input value={state.state} onChange={e=>setState({...state,state:e.target.value})} style={{marginLeft:8}}/><button onClick={setSt} style={{marginLeft:8}}>Set State</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <textarea value={JSON.stringify(exp,null,2)} onChange={e=>setExp(JSON.parse(e.target.value))} style={{width:'100%',height:160,marginTop:8}}/>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
