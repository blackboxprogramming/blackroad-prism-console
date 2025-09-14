import React, { useEffect, useState } from 'react';

export default function PPM_Reports(){
  const [okr,setOkr]=useState('No OKR digest'); const [stat,setStat]=useState('No status report'); const [cap,setCap]=useState('No capacity report'); const [road,setRoad]=useState('No roadmap');
  const load=async()=>{ try{ const o=await (await fetch('/okr/reports/OKR_000000.md')).text(); setOkr(o);}catch{} try{ const s=await (await fetch('/portfolio/reports/STATUS_000000.md')).text(); setStat(s);}catch{} try{ const c=await (await fetch('/portfolio/reports/CAPACITY_000000.md')).text(); setCap(c);}catch{} try{ const r=await (await fetch('/portfolio/reports/ROADMAP_000000.md')).text(); setRoad(r);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>OKR & Portfolio Reports</h2>
    <h3>OKR Digest</h3><pre style={{background:'#f7f7f7',padding:8}}>{okr}</pre>
    <h3>Status</h3><pre style={{background:'#f7f7f7',padding:8}}>{stat}</pre>
    <h3>Capacity</h3><pre style={{background:'#f7f7f7',padding:8}}>{cap}</pre>
    <h3>Roadmap</h3><pre style={{background:'#f7f7f7',padding:8}}>{road}</pre>
  </section>;
}
