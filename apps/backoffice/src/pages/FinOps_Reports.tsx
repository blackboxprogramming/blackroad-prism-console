import React, { useEffect, useState } from 'react';

export default function FinOps_Reports(){
  const [txt,setTxt]=useState('No report yet');
  const load=async()=>{ try{ const t=await (await fetch('/finops/reports/FINOPS_000000.md')).text(); setTxt(t);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>FinOps Reports</h2>
    <pre style={{background:'#f7f7f7',padding:8}}>{txt}</pre>
  </section>;
}
