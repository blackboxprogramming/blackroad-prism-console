import React, { useEffect, useState } from 'react';

export default function CMDB_Reports(){
  const [graph,setGraph]=useState('No graph yet'); const [cab,setCab]=useState('No CAB yet'); const [patch,setPatch]=useState('No Patch rollup yet');
  const load=async()=>{ try{ const g=await (await fetch('/cmdb/reports/GRAPH_000000.json')).text(); setGraph(g);}catch{} try{ const c=await (await fetch('/change/reports/CAB_000000.md')).text(); setCab(c);}catch{} try{ const p=await (await fetch('/patch/reports/PATCH_000000.md')).text(); setPatch(p);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>CMDB / Change / Patch Reports</h2>
    <h3>Graph</h3><pre style={{background:'#f7f7f7',padding:8}}>{graph}</pre>
    <h3>CAB</h3><pre style={{background:'#f7f7f7',padding:8}}>{cab}</pre>
    <h3>Patch</h3><pre style={{background:'#f7f7f7',padding:8}}>{patch}</pre>
  </section>;
}
