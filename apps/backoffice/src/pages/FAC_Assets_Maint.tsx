import React, { useEffect, useState } from 'react';

export default function FAC_Assets_Maint(){
  const [asset,setAsset]=useState({assetId:'hvac-1',locationId:'hq',name:'HVAC Main',category:'HVAC',serial:'SN123',vendor:'CoolAir',pm_cycle_days:90});
  const [wo,setWo]=useState({woId:'wo-1',assetId:'hvac-1',type:'PM',priority:'med',opened_by:'facops',description:'Quarterly PM'});
  const [state,setState]=useState({woId:'wo-1',state:'in_progress',notes:'Started'});
  const [recent,setRecent]=useState<any>({});
  const saveA=async()=>{ await fetch('/api/fac/assets/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(asset)}); };
  const createWO=async()=>{ await fetch('/api/fac/workorders/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(wo)}); await load(); };
  const setWO=async()=>{ await fetch('/api/fac/workorders/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/fac/workorders/recent?assetId=hvac-1')).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Assets & Maintenance</h2>
    <div><button onClick={saveA}>Save Asset</button><button onClick={createWO} style={{marginLeft:8}}>Create WO</button><button onClick={setWO} style={{marginLeft:8}}>Set WO State</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <textarea value={JSON.stringify(asset,null,2)} onChange={e=>setAsset(JSON.parse(e.target.value))} style={{width:'100%',height:130,marginTop:8}}/>
    <textarea value={JSON.stringify(wo,null,2)} onChange={e=>setWo(JSON.parse(e.target.value))} style={{width:'100%',height:110,marginTop:8}}/>
    <textarea value={JSON.stringify(state,null,2)} onChange={e=>setState(JSON.parse(e.target.value))} style={{width:'100%',height:100,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
