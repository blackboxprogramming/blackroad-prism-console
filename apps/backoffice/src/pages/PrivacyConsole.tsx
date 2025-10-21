import React, { useEffect, useState } from 'react';

export default function PrivacyConsole(){
  const [queue,setQueue]=useState<any[]>([]);
  const [subject,setSubject]=useState('');
  const [events,setEvents]=useState<any[]>([]);

  const refresh = async () => {
    // load last 50 DSAR queue entries
    const res = await fetch('/api/privacy/dsar/last50').catch(()=>null);
    if (res && res.ok) { const j = await res.json(); setQueue(j.items||[]); }
  };

  const lookupConsent = async () => {
    const id = subject.trim(); if (!id) return;
    const j = await (await fetch(`/api/privacy/consent/${id}`)).json();
    setEvents(j.events||[]);
  };

  useEffect(()=>{ refresh(); },[]);

  return <section>
    <h2>Privacy Console</h2>
    <div style={{margin:'8px 0'}}>
      <input placeholder="subjectId or email" value={subject} onChange={e=>setSubject(e.target.value)} />
      <button onClick={lookupConsent} style={{marginLeft:8}}>Load Consent</button>
    </div>
    <div><b>Consent Events:</b><pre style={{background:'#f7f7f7',padding:8}}>{JSON.stringify(events,null,2)}</pre></div>
    <h3>DSAR Queue (latest)</h3>
    <table border={1} cellPadding={6}><thead><tr><th>ID</th><th>Type</th><th>Subject</th><th>Status</th></tr></thead>
      <tbody>{queue.map((q:any)=><tr key={q.id}><td>{q.id}</td><td>{q.type}</td><td>{q.subjectId}</td><td>{q.status}</td></tr>)}</tbody>
    </table>
  </section>;
}
