import React, { useState } from 'react';

export default function AccessReview(){
  const [qid,setQid]=useState('');
  const [events,setEvents]=useState<any[]>([]);
  const [form,setForm]=useState({managerId:'',userId:'',system:'api',role:'viewer',decision:'approve',notes:''});

  const start = async ()=> {
    const quarter = prompt('Quarter (e.g., 2025Q4)') || '';
    const j = await (await fetch('/api/admin/access-review/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({quarter})})).json();
    setQid(j.id);
  };
  const load = async ()=> {
    if (!qid) return;
    const j = await (await fetch(`/api/admin/access-review/${qid}`)).json();
    setEvents(j.events||[]);
  };
  const attest = async ()=> {
    if (!qid) return;
    await fetch(`/api/admin/access-review/${qid}/attest`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
    await load();
  };

  return <section>
    <h2>Access Review</h2>
    <div>
      <button onClick={start}>Start Review</button>
      <input placeholder="Review ID" value={qid} onChange={e=>setQid(e.target.value)} style={{marginLeft:8}}/>
      <button onClick={load} style={{marginLeft:8}}>Load</button>
    </div>
    <div style={{marginTop:12}}>
      <input placeholder="Manager ID" value={form.managerId} onChange={e=>setForm({...form,managerId:e.target.value})}/>
      <input placeholder="User ID" value={form.userId} onChange={e=>setForm({...form,userId:e.target.value})} style={{marginLeft:8}}/>
      <input placeholder="System" value={form.system} onChange={e=>setForm({...form,system:e.target.value})} style={{marginLeft:8}}/>
      <input placeholder="Role" value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={{marginLeft:8}}/>
      <select value={form.decision} onChange={e=>setForm({...form,decision:e.target.value})} style={{marginLeft:8}}>
        <option>approve</option><option>revoke</option><option>reduce</option>
      </select>
      <input placeholder="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{marginLeft:8}}/>
      <button onClick={attest} style={{marginLeft:8}}>Attest</button>
    </div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(events,null,2)}</pre>
  </section>;
}
