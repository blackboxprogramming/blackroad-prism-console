import React, { useEffect, useState } from 'react';

export default function PORTAL_Announcements(){
  const [a,setA]=useState({id:'ann-1',title:'Quarterly Town Hall',md:'# Town Hall',author:'comms',audience:{dept:'ALL'},publish_at:'2025-10-01T15:00:00Z',tags:['allhands']});
  const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/portal/announcements/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(a)}); await load(); };
  const state=async()=>{ await fetch('/api/portal/announcements/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:a.id,state:'published'})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/portal/announcements/${a.id}`)).json(); setView(j); };
  const search=async()=>{ const j=await (await fetch('/api/portal/announcements/search?q=town')).json(); alert(JSON.stringify(j)); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Announcements</h2>
    <div><input value={a.id} onChange={e=>setA({...a,id:e.target.value})}/><button onClick={save} style={{marginLeft:8}}>Save</button><button onClick={state} style={{marginLeft:8}}>Publish</button><button onClick={search} style={{marginLeft:8}}>Search</button></div>
    <textarea value={JSON.stringify(a,null,2)} onChange={e=>setA(JSON.parse(e.target.value))} style={{width:'100%',height:160,marginTop:8}}/>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
