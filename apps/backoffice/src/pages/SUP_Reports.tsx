import React, { useEffect, useState } from 'react';

export default function SUP_Reports(){
  const [sla,setSla]=useState('No SLA report'); const [vol,setVol]=useState('No volume report'); const [csat,setCsat]=useState('No CSAT report');
  const load=async()=>{ try{ const s=await (await fetch('/support/reports/SLA_000000.md')).text(); setSla(s);}catch{} try{ const v=await (await fetch('/support/reports/VOLUME_000000.md')).text(); setVol(v);}catch{} try{ const c=await (await fetch('/support/reports/CSAT_000000.md')).text(); setCsat(c);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Support Reports</h2>
    <h3>SLA</h3><pre style={{background:'#f7f7f7',padding:8}}>{sla}</pre>
    <h3>Volume</h3><pre style={{background:'#f7f7f7',padding:8}}>{vol}</pre>
    <h3>CSAT</h3><pre style={{background:'#f7f7f7',padding:8}}>{csat}</pre>
  </section>;
}
