import React, { useEffect, useState } from 'react';

export default function CS_Reports(){
  const [h,setH]=useState('No report yet'); const [n,setN]=useState('No report yet');
  const load=async()=>{ try{ const t=await (await fetch('/cs/reports/HEALTH_000000.md')).text(); setH(t);}catch{} try{ const s=await (await fetch('/cs/reports/NPS_000000.md')).text(); setN(s);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>CS Reports</h2>
    <h3>Health</h3><pre style={{background:'#f7f7f7',padding:8}}>{h}</pre>
    <h3>NPS</h3><pre style={{background:'#f7f7f7',padding:8}}>{n}</pre>
  </section>;
}
