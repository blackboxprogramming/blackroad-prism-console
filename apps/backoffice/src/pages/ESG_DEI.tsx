import React, { useState } from 'react';

export default function ESG_DEI(){
  const [period,setPeriod]=useState('2025-Q3'); const [headcount,setHeadcount]=useState(25);
  const [gender,setGender]=useState('{"women":40,"men":58,"nonbinary":2}');
  const [eth,setEth]=useState('{"groupA":30,"groupB":50,"groupC":20}');
  const save=async()=>{ await fetch('/api/esg/dei/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period,headcount,gender:JSON.parse(gender),ethnicity:JSON.parse(eth)})}); alert('Saved'); };
  return <section><h2>DEI</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><input type="number" value={headcount} onChange={e=>setHeadcount(Number(e.target.value))} style={{marginLeft:8}}/>
      <textarea value={gender} onChange={e=>setGender(e.target.value)} style={{width:'100%',height:80,marginTop:8}}/>
      <textarea value={eth} onChange={e=>setEth(e.target.value)} style={{width:'100%',height:80,marginTop:8}}/>
      <button onClick={save} style={{marginTop:8}}>Save</button></div>
  </section>;
}
