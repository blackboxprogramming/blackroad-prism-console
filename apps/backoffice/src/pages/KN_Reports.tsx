import React, { useEffect, useState } from 'react';

export default function KN_Reports(){
  const [txt,setTxt]=useState('No report yet');
  const load=async()=>{ try{ const t=await (await fetch('/knowledge/reports/KN_000000.md')).text(); setTxt(t);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Knowledge Reports</h2>
    <pre style={{background:'#f7f7f7',padding:8}}>{txt}</pre>
  </section>;
}
