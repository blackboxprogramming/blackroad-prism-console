import React, { useEffect, useState } from 'react';

export default function FAC_Locations_Spaces(){
  const [loc,setLoc]=useState({id:'hq',name:'HQ',address:'123 Main St',regions:['US'],tz:'America/Chicago'});
  const [space,setSpace]=useState({id:'hq-rm101',locationId:'hq',type:'room',name:'Room 101',capacity:8,features:['display','vc']});
  const [lv,setLv]=useState<any>(null); const [sv,setSv]=useState<any>(null);
  const saveL=async()=>{ await fetch('/api/fac/locations/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(loc)}); await loadL(); };
  const saveS=async()=>{ await fetch('/api/fac/spaces/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(space)}); await loadS(); };
  const loadL=async()=>{ const j=await (await fetch(`/api/fac/locations/${loc.id}`)).json(); setLv(j); };
  const loadS=async()=>{ const j=await (await fetch(`/api/fac/spaces/${space.id}`)).json(); setSv(j); };
  useEffect(()=>{ loadL(); loadS(); },[]);
  return <section><h2>Locations & Spaces</h2>
    <div><input value={loc.id} onChange={e=>setLoc({...loc,id:e.target.value})}/><button onClick={saveL} style={{marginLeft:8}}>Save Location</button></div>
    <div style={{marginTop:8}}><input value={space.id} onChange={e=>setSpace({...space,id:e.target.value})}/><button onClick={saveS} style={{marginLeft:8}}>Save Space</button></div>
    <textarea value={JSON.stringify(loc,null,2)} onChange={e=>setLoc(JSON.parse(e.target.value))} style={{width:'100%',height:130,marginTop:8}}/>
    <textarea value={JSON.stringify(space,null,2)} onChange={e=>setSpace(JSON.parse(e.target.value))} style={{width:'100%',height:130,marginTop:8}}/>
    {lv && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(lv,null,2)}</pre>}
    {sv && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(sv,null,2)}</pre>}
  </section>;
}
