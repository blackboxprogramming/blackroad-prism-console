import React, { useEffect, useState } from 'react';

export default function Ideas(){
  const [items,setItems]=useState<any[]>([]);
  const [title,setTitle]=useState(''); const [detail,setDetail]=useState('');
  const refresh=async()=>{ const j=await (await fetch('/api/product/ideas/recent')).json(); setItems(j.items||[]); };
  const create=async()=>{ await fetch('/api/product/ideas/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,detail,requester:'user'})}); setTitle(''); setDetail(''); await refresh(); };
  const vote=async(id:string)=>{ await fetch(`/api/product/ideas/${id}/vote`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({voter:'me',weight:1})}); await refresh(); };
  const setStatus=async(id:string)=>{ const status=prompt('Status (open|triage|planned|in-progress|done|wontfix)','triage')||'triage'; await fetch(`/api/product/ideas/${id}/status`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})}); await refresh(); };
  useEffect(()=>{ refresh(); },[]);
  return <section><h2>Ideas & Feature Requests</h2>
    <div><input placeholder="title" value={title} onChange={e=>setTitle(e.target.value)} /><input placeholder="detail" value={detail} onChange={e=>setDetail(e.target.value)} style={{marginLeft:8,width:400}}/><button onClick={create} style={{marginLeft:8}}>Create</button></div>
    <table border={1} cellPadding={6} style={{marginTop:12}}>
      <thead><tr><th>Title</th><th>Status</th><th>Votes</th><th>Actions</th></tr></thead>
      <tbody>{items.map(i=><tr key={i.id}><td>{i.title}</td><td>{i.status}</td><td>{i.votes||0}</td><td><button onClick={()=>vote(i.id)}>Vote</button><button onClick={()=>setStatus(i.id)} style={{marginLeft:6}}>Set Status</button></td></tr>)}</tbody>
    </table>
  </section>;
}
