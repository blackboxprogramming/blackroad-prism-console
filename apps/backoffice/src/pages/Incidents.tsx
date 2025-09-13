import React, { useEffect, useState } from 'react';

export default function Incidents(){
  const [items,setItems]=useState<any[]>([]);
  const [summary,setSummary]=useState('');
  const [service,setService]=useState('api');
  const [sev,setSev]=useState('Sev-3');

  const refresh = async ()=> {
    const j = await (await fetch('/api/itsm/incidents/recent')).json();
    setItems(j.items||[]);
  };
  const declare = async ()=> {
    const r = await fetch('/api/itsm/incidents/declare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sev,summary,service})});
    const j = await r.json(); if (j.ok) { setSummary(''); await refresh(); }
  };

  useEffect(()=>{ refresh(); },[]);

  return <section>
    <h2>Incidents</h2>
    <div style={{margin:'8px 0'}}>
      <input placeholder="Summary" value={summary} onChange={e=>setSummary(e.target.value)} />
      <select value={service} onChange={e=>setService(e.target.value)} style={{marginLeft:8}}>
        <option value="api">api</option>
        <option value="web">web</option>
      </select>
      <select value={sev} onChange={e=>setSev(e.target.value)} style={{marginLeft:8}}>
        <option>Sev-1</option><option>Sev-2</option><option>Sev-3</option><option>Sev-4</option>
      </select>
      <button onClick={declare} style={{marginLeft:8}}>Declare</button>
      <button onClick={refresh} style={{marginLeft:8}}>Refresh</button>
    </div>
    <table border={1} cellPadding={6}><thead><tr><th>ID</th><th>Sev</th><th>Summary</th><th>Status</th></tr></thead>
      <tbody>{items.map((x:any)=><tr key={x.id}><td>{x.id}</td><td>{x.sev}</td><td>{x.summary}</td><td>{x.status}</td></tr>)}</tbody>
    </table>
  </section>;
}
