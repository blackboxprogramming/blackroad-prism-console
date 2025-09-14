import React, { useEffect, useState } from 'react';

export default function BCDR_Reports(){
  const [backups,setBackups]=useState('No backup report'); const [restore,setRestore]=useState('No restore report'); const [drills,setDrills]=useState('No drill report');
  const load=async()=>{ try{ const b=await (await fetch('/bcdr/reports/BACKUPS_000000.md')).text(); setBackups(b);}catch{} try{ const r=await (await fetch('/bcdr/reports/RESTORE_000000.md')).text(); setRestore(r);}catch{} try{ const d=await (await fetch('/bcdr/reports/DRILLS_000000.md')).text(); setDrills(d);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Resilience Reports</h2>
    <h3>Backups</h3><pre style={{background:'#f7f7f7',padding:8}}>{backups}</pre>
    <h3>Restore Tests</h3><pre style={{background:'#f7f7f7',padding:8}}>{restore}</pre>
    <h3>Drills</h3><pre style={{background:'#f7f7f7',padding:8}}>{drills}</pre>
  </section>;
}
