import React, { useEffect, useState } from 'react';

export default function Audit(){
  const [rows,setRows] = useState<any[]>([]);
  useEffect(()=>{ fetch('/api/admin/org/audit').then(r=>r.json()).then(d=>setRows(d.hits||[])); },[]);
  return <div>
    <h2>Audit Log</h2>
    <table border={1} cellPadding={6}>
      <thead><tr><th>Time</th><th>Action</th><th>Meta</th></tr></thead>
      <tbody>{rows.map((r,i)=><tr key={i}><td>{new Date(r.ts).toISOString()}</td><td>{r.action}</td><td><pre style={{margin:0}}>{JSON.stringify(r.meta,null,2)}</pre></td></tr>)}</tbody>
    </table>
  </div>;
}
