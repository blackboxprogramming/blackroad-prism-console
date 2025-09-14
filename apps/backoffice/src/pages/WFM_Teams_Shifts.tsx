import React, { useEffect, useState } from 'react';

export default function WFM_Teams_Shifts(){
  const [team,setTeam]=useState({id:'ENG-PLAT',name:'Engineering Platform',locationId:'hq',managerId:'mgr1',cost_center:'ENG',roles:['SWE','SRE']});
  const [shift,setShift]=useState({code:'STD',title:'Standard 9–5',start:'09:00',end:'17:00',break_min:60});
  const [tv,setTv]=useState<any>(null); const [sv,setSv]=useState<any>(null);
  const saveTeam=async()=>{ await fetch('/api/wfm/teams/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(team)}); await loadT(); };
  const saveShift=async()=>{ await fetch('/api/wfm/shifts/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(shift)}); await loadS(); };
  const loadT=async()=>{ const j=await (await fetch(`/api/wfm/teams/${team.id}`)).json(); setTv(j); };
  const loadS=async()=>{ const j=await (await fetch(`/api/wfm/shifts/${shift.code}`)).json(); setSv(j); };
  useEffect(()=>{ loadT(); loadS(); },[]);
  return <section><h2>Teams & Shifts</h2>
    <div><button onClick={saveTeam}>Save Team</button><button onClick={saveShift} style={{marginLeft:8}}>Save Shift</button></div>
    <textarea value={JSON.stringify(team,null,2)} onChange={e=>setTeam(JSON.parse(e.target.value))} style={{width:'100%',height:130,marginTop:8}}/>
    <textarea value={JSON.stringify(shift,null,2)} onChange={e=>setShift(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    {tv && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(tv,null,2)}</pre>}
    {sv && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(sv,null,2)}</pre>}
  </section>;
}
