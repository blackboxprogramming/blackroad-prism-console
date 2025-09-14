import React, { useEffect, useState } from 'react';

export default function Spend_Reports(){
  const [spend,setSpend]=useState('No report yet'); const [aging,setAging]=useState('No report yet');
  const load=async()=>{ try{ const s=await (await fetch('/p2p/reports/SPEND_000000.md')).text(); setSpend(s);}catch{} try{ const a=await (await fetch('/p2p/reports/AP_AGING_000000.md')).text(); setAging(a);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Spend Reports</h2>
    <h3>Spend</h3><pre style={{background:'#f7f7f7',padding:8}}>{spend}</pre>
    <h3>AP Aging</h3><pre style={{background:'#f7f7f7',padding:8}}>{aging}</pre>
  </section>;
}
