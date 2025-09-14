import React, { useEffect, useState } from 'react';

export default function FAC_Reports(){
  const [occ,setOcc]=useState('No occupancy'); const [mnt,setMnt]=useState('No maintenance'); const [ehs,setEhs]=useState('No EHS');
  const load=async()=>{ try{ const o=await (await fetch('/fac/reports/OCC_00000000.md')).text(); setOcc(o);}catch{} try{ const m=await (await fetch('/fac/reports/MAINT_000000.md')).text(); setMnt(m);}catch{} try{ const e=await (await fetch('/fac/reports/EHS_000000.md')).text(); setEhs(e);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Facilities Reports</h2>
    <h3>Occupancy</h3><pre style={{background:'#f7f7f7',padding:8}}>{occ}</pre>
    <h3>Maintenance</h3><pre style={{background:'#f7f7f7',padding:8}}>{mnt}</pre>
    <h3>EHS</h3><pre style={{background:'#f7f7f7',padding:8}}>{ehs}</pre>
  </section>;
}
