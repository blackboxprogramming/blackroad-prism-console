import React, { useState } from 'react';

export default function PRDs(){
  const [key,setKey]=useState('example'); const [title,setTitle]=useState('Example PRD'); const [md,setMd]=useState('# PRD'); const [view,setView]=useState<any>(null);
  const create=async()=>{ await fetch('/api/product/prd/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,title,md})}); alert('Created'); };
  const update=async()=>{ await fetch('/api/product/prd/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,md})}); alert('Saved'); };
  const request=async()=>{ const reviewers=(prompt('Reviewers (comma emails)')||'').split(',').map(s=>s.trim()).filter(Boolean); const j=await (await fetch('/api/product/prd/request-review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,reviewers})})).json(); alert('Routed to: '+(j.reviewers||[]).join(', ')); };
  const load=async()=>{ const j=await (await fetch(`/api/product/prd/${key}`)).json(); setView(j); setTitle(j.title||title); setMd(j.md||md); };
  return <section><h2>PRDs</h2>
    <div><input placeholder="key" value={key} onChange={e=>setKey(e.target.value)}/><input placeholder="title" value={title} onChange={e=>setTitle(e.target.value)} style={{marginLeft:8}}/>
      <button onClick={create} style={{marginLeft:8}}>Create</button><button onClick={update} style={{marginLeft:8}}>Save</button><button onClick={request} style={{marginLeft:8}}>Request Review</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <textarea value={md} onChange={e=>setMd(e.target.value)} style={{width:'100%',height:260,marginTop:8}}/>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
