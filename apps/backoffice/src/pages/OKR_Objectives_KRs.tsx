import React, { useEffect, useState } from 'react';

export default function OKR_Objectives_KRs(){
  const [obj,setObj]=useState({id:'OBJ-1',title:'Delight customers',owner:'cpo',period:'2025-Q4',tags:['cx']});
  const [kr,setKr]=useState({id:'KR-1',objectiveId:'OBJ-1',title:'CSAT >= 4.6',type:'metric',target:4.6,unit:'score',baseline:4.3,direction:'up'});
  const saveO=async()=>{ await fetch('/api/okr/objectives/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(obj)}); };
  const saveK=async()=>{ await fetch('/api/okr/krs/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(kr)}); };
  useEffect(()=>{},[]);
  return <section><h2>Objectives & KRs</h2>
    <div><button onClick={saveO}>Save Objective</button><button onClick={saveK} style={{marginLeft:8}}>Save KR</button></div>
    <textarea value={JSON.stringify(obj,null,2)} onChange={e=>setObj(JSON.parse(e.target.value))} style={{width:'100%',height:140,marginTop:8}}/>
    <textarea value={JSON.stringify(kr,null,2)} onChange={e=>setKr(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
  </section>;
}
