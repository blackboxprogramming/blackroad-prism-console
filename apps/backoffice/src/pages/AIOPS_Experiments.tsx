import React, { useEffect, useState } from 'react';

export default function AIOPS_Experiments(){
  const [exp,setExp]=useState({expId:'exp-001',model:'churn_xgb',datasetId:'crm_contacts',config:{max_depth:6,eta:0.1},cost_center:'DATA'});
  const [log,setLog]=useState({expId:'exp-001',metric:'auc',value:0.89}); const [view,setView]=useState<any>({});
  const create=async()=>{ await fetch('/api/aiops/experiments/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(exp)}); };
  const addLog=async()=>{ await fetch('/api/aiops/experiments/log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(log)}); };
  const recent=async()=>{ const j=await (await fetch('/api/aiops/experiments/recent?model=churn_xgb')).json(); setView(j); };
  useEffect(()=>{ recent(); },[]);
  return <section><h2>Experiments & Training</h2>
    <div><button onClick={create}>Create Exp</button><button onClick={addLog} style={{marginLeft:8}}>Log Metric</button><button onClick={recent} style={{marginLeft:8}}>Recent</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>
  </section>;
}
