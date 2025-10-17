import React, { useEffect, useState } from 'react';

export default function AIOPS_Reports(){
  const [model,setModel]=useState('No model report'); const [mon,setMon]=useState('No monitor report');
  const load=async()=>{ try{ const m=await (await fetch('/aiops/reports/MODEL_000000.md')).text(); setModel(m);}catch{} try{ const r=await (await fetch('/aiops/reports/MONITOR_000000.md')).text(); setMon(r);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>AI/ML Reports</h2>
    <h3>Model</h3><pre style={{background:'#f7f7f7',padding:8}}>{model}</pre>
    <h3>Monitoring</h3><pre style={{background:'#f7f7f7',padding:8}}>{mon}</pre>
  </section>;
}
