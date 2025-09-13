import React, { useEffect, useState } from 'react';

export default function Devices(){
  const [items,setItems]=useState<any[]>([]);
  const refresh = async ()=> {
    const j = await (await fetch('/api/admin/devices/list')).json();
    setItems(j.items||[]);
  };
  const register = async ()=> {
    const deviceId = prompt('Device ID?')||''; const owner = prompt('Owner?')||''; const platform = prompt('Platform (ios/android/mac/win/linux)?')||'';
    await fetch('/api/admin/devices/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({deviceId,owner,platform})});
    await refresh();
  };
  useEffect(()=>{ refresh(); },[]);
  return <section>
    <h2>Devices</h2>
    <button onClick={register}>Register</button>
    <button onClick={refresh} style={{marginLeft:8}}>Refresh</button>
    <table border={1} cellPadding={6} style={{marginTop:12}}>
      <thead><tr><th>ID</th><th>Owner</th><th>Platform</th><th>Encrypted</th><th>Compliant</th><th>Last Seen</th></tr></thead>
      <tbody>{items.map((d:any)=><tr key={d.deviceId}><td>{d.deviceId}</td><td>{d.owner}</td><td>{d.platform}</td><td>{String(d.encrypted)}</td><td>{String(d.compliant)}</td><td>{new Date(d.lastSeen).toISOString()}</td></tr>)}</tbody>
    </table>
  </section>;
}
