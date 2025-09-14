import React, { useEffect, useState } from 'react';

export default function CS_Playbooks(){
  const [w,setW]=useState('{"weights":{"product_usage":0.4,"support":0.2,"nps":0.2,"finance":0.2}}');
  const [pb,setPb]=useState('{"key":"save_risk","triggers":{"health_below":0.6},"steps":[{"action":"Email CSM","owner":"csm"},{"action":"Schedule EBR","owner":"csm"}]}');
  const saveW=async()=>{ await fetch('/api/cs/weights/set',{method:'POST',headers:{'Content-Type':'application/json'},body:w}); };
  const savePB=async()=>{ await fetch('/api/cs/playbooks/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:pb}); };
  useEffect(()=>{},[]);
  return <section><h2>Weights & Playbooks</h2>
    <h4>Weights</h4><textarea value={w} onChange={e=>setW(e.target.value)} style={{width:'100%',height:120}}/><button onClick={saveW}>Save</button>
    <h4 style={{marginTop:12}}>Playbook</h4><textarea value={pb} onChange={e=>setPb(e.target.value)} style={{width:'100%',height:140}}/><button onClick={savePB}>Save</button>
  </section>;
}
