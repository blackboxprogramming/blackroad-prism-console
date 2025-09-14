import React, { useState } from 'react';

export default function CONS_TB(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7)); const [entityId,setEntityId]=useState('US-CO');
  const [rows,setRows]=useState('[{"account":"4000","amount":100000,"dc":"C"},{"account":"1000","amount":100000,"dc":"D"}]');
  const importTB=async()=>{ await fetch('/api/cons/tb/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period,entityId,rows:JSON.parse(rows)})}); alert('Imported'); };
  const view=async()=>{ const j=await (await fetch(`/api/cons/tb/snapshot?period=${period}&entityId=${entityId}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>Trial Balance Import</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><input value={entityId} onChange={e=>setEntityId(e.target.value)} style={{marginLeft:8}}/><button onClick={importTB} style={{marginLeft:8}}>Import</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
    <textarea value={rows} onChange={e=>setRows(e.target.value)} style={{width:'100%',height:140,marginTop:8}}/>
  </section>;
}
