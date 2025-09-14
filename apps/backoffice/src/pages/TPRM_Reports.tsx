import React, { useEffect, useState } from 'react';

export default function TPRM_Reports(){
  const [issues,setIssues]=useState('No issues report'); const [risk,setRisk]=useState('No risk report'); const [score,setScore]=useState('No scorecards');
  const load=async()=>{ try{ const i=await (await fetch('/tprm/reports/ISSUES_000000.md')).text(); setIssues(i);}catch{} try{ const r=await (await fetch('/tprm/reports/RISK_000000.md')).text(); setRisk(r);}catch{} try{ const s=await (await fetch('/tprm/reports/SCORECARDS_000000.md')).text(); setScore(s);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>TPRM Reports</h2>
    <h3>Issues</h3><pre style={{background:'#f7f7f7',padding:8}}>{issues}</pre>
    <h3>Risk</h3><pre style={{background:'#f7f7f7',padding:8}}>{risk}</pre>
    <h3>Scorecards</h3><pre style={{background:'#f7f7f7',padding:8}}>{score}</pre>
  </section>;
}
