import React, { useEffect, useState } from 'react';

export default function PSA_Utilization(){
  const [util,setUtil]=useState('No report yet'); const [margin,setMargin]=useState('No report yet');
  const load=async()=>{ try{ const u=await (await fetch('/psa/reports/UTIL_000000.md')).text(); setUtil(u);}catch{} try{ const m=await (await fetch('/psa/reports/MARGIN_000000.md')).text(); setMargin(m);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Utilization & Margin</h2>
    <h3>Utilization</h3><pre style={{background:'#f7f7f7',padding:8}}>{util}</pre>
    <h3>Margin</h3><pre style={{background:'#f7f7f7',padding:8}}>{margin}</pre>
  </section>;
}
