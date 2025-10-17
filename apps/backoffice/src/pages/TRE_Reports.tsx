import React, { useEffect, useState } from 'react';

export default function TRE_Reports(){
  const [pos,setPos]=useState('No pos'); const [rec,setRec]=useState('No recon'); const [fx,setFx]=useState('No fx'); const [intR,setIntR]=useState('No interest'); const [fcst,setFcst]=useState('No forecast');
  const load=async()=>{ try{ const p=await (await fetch('/treasury/reports/POS_00000000.md')).text(); setPos(p);}catch{} try{ const r=await (await fetch('/treasury/reports/RECON_000000.md')).text(); setRec(r);}catch{} try{ const f=await (await fetch('/treasury/reports/FX_000000.md')).text(); setFx(f);}catch{} try{ const i=await (await fetch('/treasury/reports/INTEREST_000000.md')).text(); setIntR(i);}catch{} try{ const c=await (await fetch('/treasury/reports/FORECAST_000000.md')).text(); setFcst(c);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Treasury Reports</h2>
    <h3>Position</h3><pre style={{background:'#f7f7f7',padding:8}}>{pos}</pre>
    <h3>Reconciliation</h3><pre style={{background:'#f7f7f7',padding:8}}>{rec}</pre>
    <h3>FX</h3><pre style={{background:'#f7f7f7',padding:8}}>{fx}</pre>
    <h3>Interest</h3><pre style={{background:'#f7f7f7',padding:8}}>{intR}</pre>
    <h3>Forecast</h3><pre style={{background:'#f7f7f7',padding:8}}>{fcst}</pre>
  </section>;
}
