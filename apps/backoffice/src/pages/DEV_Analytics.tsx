
import React, { useEffect, useState } from 'react';

export default function DEV_Analytics(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7)); const [summary,setSummary]=useState<any>({});
  const view=async()=>{ const j=await (await fetch(`/api/dev/analytics/summary?period=${period}`)).json(); setSummary(j); };
  useEffect(()=>{ view(); },[]);
  return <section><h2>Usage Analytics</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><button onClick={view} style={{marginLeft:8}}>Refresh</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(summary,null,2)}</pre>
  </section>;
}
