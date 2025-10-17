import React, { useState } from 'react';

export default function OnOffboarding(){
  const [onId,setOnId]=useState(''); const [offId,setOffId]=useState(''); const [detail,setDetail]=useState<any>({});
  const createOn=async()=>{ const email=prompt('Email?')||''; const name=prompt('Name?')||''; const role=prompt('Role?')||''; const managerId=prompt('Manager (email)?')||''; const startDate=prompt('Start YYYY-MM-DD?')||''; const j=await (await fetch('/api/hr/onboarding/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,name,role,managerId,startDate})})).json(); setOnId(j.id); };
  const createOff=async()=>{ const employeeId=prompt('Employee ID/email?')||''; const lastDay=prompt('Last YYYY-MM-DD?')||''; const j=await (await fetch('/api/hr/offboarding/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({employeeId,lastDay})})).json(); setOffId(j.id); };
  const load=async()=>{ const id=onId||offId; if(!id) return; const url= onId?`/api/hr/onboarding/${onId}`:`/api/hr/offboarding/${offId}`; const j=await (await fetch(url)).json(); setDetail(j); };
  return <section><h2>On/Offboarding</h2><div><button onClick={createOn}>New Onboarding</button><button onClick={createOff} style={{marginLeft:8}}>New Offboarding</button><input placeholder="On ID" value={onId} onChange={e=>setOnId(e.target.value)} style={{marginLeft:8}}/><input placeholder="Off ID" value={offId} onChange={e=>setOffId(e.target.value)} style={{marginLeft:8}}/><button onClick={load} style={{marginLeft:8}}>Load</button></div><pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(detail,null,2)}</pre></section>;
}
