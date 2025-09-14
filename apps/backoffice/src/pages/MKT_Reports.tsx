import React, { useEffect, useState } from 'react';

export default function MKT_Reports(){
  const [attr,setAttr]=useState('No attribution report'); const [roas,setRoas]=useState('No ROAS report');
  const load=async()=>{ try{ const a=await (await fetch('/mkt/reports/ATTR_000000.md')).text(); setAttr(a);}catch{} try{ const r=await (await fetch('/mkt/reports/ROAS_000000.md')).text(); setRoas(r);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Marketing Reports</h2>
    <h3>Attribution</h3><pre style={{background:'#f7f7f7',padding:8}}>{attr}</pre>
    <h3>ROAS</h3><pre style={{background:'#f7f7f7',padding:8}}>{roas}</pre>
  </section>;
}
