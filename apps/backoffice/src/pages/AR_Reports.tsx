import React, { useEffect, useState } from 'react';

export default function AR_Reports(){
  const [aging,setAging]=useState('No report yet'); const [leak,setLeak]=useState('No report yet');
  const load=async()=>{ try{ const a=await (await fetch('/ar/reports/AGING_000000.md')).text(); setAging(a);}catch{} try{ const l=await (await fetch('/ar/reports/LEAKAGE_000000.md')).text(); setLeak(l);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>AR Reports</h2>
    <h3>Aging</h3><pre style={{background:'#f7f7f7',padding:8}}>{aging}</pre>
    <h3>Leakage</h3><pre style={{background:'#f7f7f7',padding:8}}>{leak}</pre>
  </section>;
}
