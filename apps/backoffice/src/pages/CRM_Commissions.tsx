
import React, { useState } from 'react';

export default function CRM_Commissions(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7));
  const setPlan=async()=>{ const plan={planId:'base',base_rate:0.08,tiers:[],accelerators:[]}; await fetch('/api/crm/icm/plan/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(plan)}); };
  const calc=async()=>{ const j=await (await fetch('/api/crm/icm/calc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period})})).json(); alert(JSON.stringify(j)); };
  const recent=async()=>{ const j=await (await fetch(`/api/crm/icm/recent?period=${period}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>Incentive Compensation</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><button onClick={setPlan} style={{marginLeft:8}}>Set Plan</button><button onClick={calc} style={{marginLeft:8}}>Calc</button><button onClick={recent} style={{marginLeft:8}}>Recent</button></div>
  </section>;
}

