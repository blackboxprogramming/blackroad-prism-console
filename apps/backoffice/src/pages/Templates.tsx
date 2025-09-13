import React, { useState } from 'react';

export default function Templates(){
  const [key,setKey]=useState('welcome'); const [channel,setChannel]=useState('email'); const [aSubject,setASubject]=useState('Welcome to BlackRoad'); const [aBody,setABody]=useState('<h1>Hi {{name}}</h1>'); const [bSubject,setBSubject]=useState('Let’s get started'); const [bBody,setBBody]=useState('<h1>Hey {{name}}</h1>'); const [split,setSplit]=useState(50);
  const upsert=async()=>{ await fetch('/api/mkt/templates/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,channel,a:{subject:aSubject,body:aBody},b:{subject:bSubject,body:bBody},split})}); alert('Saved'); };
  return <section><h2>Templates (A/B)</h2>
    <input value={key} onChange={e=>setKey(e.target.value)} /><select value={channel} onChange={e=>setChannel(e.target.value)} style={{marginLeft:8}}><option>email</option><option>sms</option><option>inapp</option></select>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:8}}>
      <div><h3>Variant A</h3><input placeholder="subject" value={aSubject} onChange={e=>setASubject(e.target.value)}/><textarea value={aBody} onChange={e=>setABody(e.target.value)} style={{width:'100%',height:120,marginTop:6}}/></div>
      <div><h3>Variant B</h3><input placeholder="subject" value={bSubject} onChange={e=>setBSubject(e.target.value)}/><textarea value={bBody} onChange={e=>setBBody(e.target.value)} style={{width:'100%',height:120,marginTop:6}}/></div>
    </div>
    <div style={{marginTop:8}}><label>Split % A</label><input type="number" value={split} onChange={e=>setSplit(Number(e.target.value))} style={{marginLeft:8,width:80}}/></div>
    <button onClick={upsert} style={{marginTop:8}}>Save</button>
  </section>;
}
