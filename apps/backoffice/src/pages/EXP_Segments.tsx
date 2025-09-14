import React, { useEffect, useState } from 'react';

export default function EXP_Segments(){
  const [seg,setSeg]=useState({id:'all',description:'All users',criteria:[]});
  const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/exp/segments/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(seg)}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/exp/segments/${seg.id}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Segments</h2>
    <div><input value={seg.id} onChange={e=>setSeg({...seg,id:e.target.value})}/><button onClick={save} style={{marginLeft:8}}>Save</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <textarea value={JSON.stringify(seg,null,2)} onChange={e=>setSeg(JSON.parse(e.target.value))} style={{width:'100%',height:140,marginTop:8}}/>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
