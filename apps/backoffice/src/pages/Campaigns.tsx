import React, { useState } from 'react';

export default function Campaigns(){
  const [name,setName]=useState('Welcome Blast'); const [channel,setChannel]=useState('email'); const [segmentKey,setSegmentKey]=useState('all_users'); const [template,setTemplate]=useState('welcome');
  const create=async()=>{ const j=await (await fetch('/api/mkt/campaigns/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,channel,segmentKey,template})})).json(); alert('Created '+j.id); };
  return <section><h2>Campaigns</h2>
    <input value={name} onChange={e=>setName(e.target.value)} />
    <select value={channel} onChange={e=>setChannel(e.target.value)} style={{marginLeft:8}}><option>email</option><option>sms</option><option>inapp</option></select>
    <input placeholder="segment key" value={segmentKey} onChange={e=>setSegmentKey(e.target.value)} style={{marginLeft:8}}/>
    <input placeholder="template key" value={template} onChange={e=>setTemplate(e.target.value)} style={{marginLeft:8}}/>
    <button onClick={create} style={{marginLeft:8}}>Create</button>
  </section>;
}
