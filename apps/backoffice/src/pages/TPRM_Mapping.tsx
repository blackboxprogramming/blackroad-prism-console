import React, { useEffect, useState } from 'react';

export default function TPRM_Mapping(){
  const [map,setMap]=useState({vendorId:'vend-1',contractId:'C-1',dpaId:'dpa-1',services:['support'],data_categories:['PII'],subprocessors:['sub-1']});
  const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/tprm/map/contract',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(map)}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/tprm/map/${map.vendorId}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Contract & Data Mapping</h2>
    <div><input value={map.vendorId} onChange={e=>setMap({...map,vendorId:e.target.value})}/><input value={map.contractId} onChange={e=>setMap({...map,contractId:e.target.value})} style={{marginLeft:8}}/><button onClick={save} style={{marginLeft:8}}>Save</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
