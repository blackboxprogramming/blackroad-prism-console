import React, { useEffect, useState } from 'react';

export default function WFM_Reports(){
  const [attn,setAttn]=useState('No attendance'); const [cov,setCov]=useState('No coverage'); const [lab,setLab]=useState('No labor');
  const load=async()=>{ try{ const a=await (await fetch('/wfm/reports/ATTN_00000000.md')).text(); setAttn(a);}catch{} try{ const c=await (await fetch('/wfm/reports/COVERAGE_000000.md')).text(); setCov(c);}catch{} try{ const l=await (await fetch('/wfm/reports/LABOR_000000.md')).text(); setLab(l);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>WFM Reports</h2>
    <h3>Attendance Exceptions</h3><pre style={{background:'#f7f7f7',padding:8}}>{attn}</pre>
    <h3>Coverage</h3><pre style={{background:'#f7f7f7',padding:8}}>{cov}</pre>
    <h3>Labor Cost</h3><pre style={{background:'#f7f7f7',padding:8}}>{lab}</pre>
  </section>;
}
