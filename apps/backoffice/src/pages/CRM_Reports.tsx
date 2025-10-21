
import React, { useEffect, useState } from 'react';

export default function CRM_Reports(){
  const [pipe,setPipe]=useState('No report yet'); const [fc,setFc]=useState('No report yet'); const [comm,setComm]=useState('No report yet'); const [ren,setRen]=useState('No report yet');
  const load=async()=>{ try{ const p=await (await fetch('/crm/reports/PIPE_000000.md')).text(); setPipe(p);}catch{} try{ const f=await (await fetch('/crm/reports/FC_000000.md')).text(); setFc(f);}catch{} try{ const c=await (await fetch('/crm/reports/COMM_000000.md')).text(); setComm(c);}catch{} try{ const r=await (await fetch('/crm/reports/RENEW_000000.md')).text(); setRen(r);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>CRM Reports</h2>
    <h3>Pipeline Health</h3><pre style={{background:'#f7f7f7',padding:8}}>{pipe}</pre>
    <h3>Forecast</h3><pre style={{background:'#f7f7f7',padding:8}}>{fc}</pre>
    <h3>Commissions</h3><pre style={{background:'#f7f7f7',padding:8}}>{comm}</pre>
    <h3>Renewals</h3><pre style={{background:'#f7f7f7',padding:8}}>{ren}</pre>
  </section>;
}

