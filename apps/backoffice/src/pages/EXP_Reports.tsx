import React, { useEffect, useState } from 'react';

export default function EXP_Reports(){
  const [exp,setExp]=useState('No experiment report yet');
  const load=async()=>{ try{ const e=await (await fetch('/exp/reports/EXP_000000.md')).text(); setExp(e);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Experiment Reports</h2>
    <pre style={{background:'#f7f7f7',padding:8}}>{exp}</pre>
  </section>;
}
