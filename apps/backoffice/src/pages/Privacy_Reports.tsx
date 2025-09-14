import React, { useEffect, useState } from 'react';

export default function Privacy_Reports(){
  const [dsar,setDsar]=useState('No DSAR report'); const [dlp,setDlp]=useState('No DLP report'); const [ret,setRet]=useState('No retention report');
  const load=async()=>{ try{ const d=await (await fetch('/privacy/reports/DSAR_000000.md')).text(); setDsar(d);}catch{} try{ const l=await (await fetch('/privacy/reports/DLP_000000.md')).text(); setDlp(l);}catch{} try{ const r=await (await fetch('/privacy/reports/RETENTION_000000.md')).text(); setRet(r);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Privacy Reports</h2>
    <h3>DSAR</h3><pre style={{background:'#f7f7f7',padding:8}}>{dsar}</pre>
    <h3>DLP</h3><pre style={{background:'#f7f7f7',padding:8}}>{dlp}</pre>
    <h3>Retention</h3><pre style={{background:'#f7f7f7',padding:8}}>{ret}</pre>
  </section>;
}
