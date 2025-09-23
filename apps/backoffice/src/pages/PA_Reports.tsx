import React, { useEffect, useState } from 'react';

export default function PA_Reports(){
  const [metrics,setMetrics]=useState('No metrics'); const [funnel,setFunnel]=useState('No funnel'); const [ret,setRet]=useState('No retention');
  const load=async()=>{ try{ const m=await (await fetch('/pa/reports/METRICS_00000000.md')).text(); setMetrics(m);}catch{} try{ const f=await (await fetch('/pa/reports/FUNNEL_000000.md')).text(); setFunnel(f);}catch{} try{ const r=await (await fetch('/pa/reports/RETENTION_000000.md')).text(); setRet(r);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>PA Reports</h2>
    <h3>Daily Metrics</h3><pre style={{background:'#f7f7f7',padding:8}}>{metrics}</pre>
    <h3>Funnels</h3><pre style={{background:'#f7f7f7',padding:8}}>{funnel}</pre>
    <h3>Retention</h3><pre style={{background:'#f7f7f7',padding:8}}>{ret}</pre>
  </section>;
}
