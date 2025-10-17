import React, { useEffect, useState } from 'react';

export default function ELT_Reports(){
  const [lin,setLin]=useState('No lineage report'); const [costs,setCosts]=useState('No costs report');
  const load=async()=>{ try{ const l=await (await fetch('/elt/reports/LINEAGE_000000.md')).text(); setLin(l);}catch{} try{ const c=await (await fetch('/elt/reports/COSTS_000000.md')).text(); setCosts(c);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>ELT Reports</h2>
    <h3>Lineage</h3><pre style={{background:'#f7f7f7',padding:8}}>{lin}</pre>
    <h3>Costs</h3><pre style={{background:'#f7f7f7',padding:8}}>{costs}</pre>
  </section>;
}
