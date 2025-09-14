import React, { useEffect, useState } from 'react';

export default function LMS_Catalog_Paths(){
  const [course,setCourse]=useState({id:'sec-awareness',title:'Security Awareness',owner:'sec',tags:['security'],modules:[{id:'m1',title:'Intro',duration_min:10,content_md:'# Intro'}],required:true});
  const [path,setPath]=useState({key:'onboarding',name:'Onboarding Path',items:[{type:'course',ref:'sec-awareness'},{type:'policy',ref:'code-of-conduct'}],audience:{dept:'ENG'}});
  const [cv,setCv]=useState<any>(null); const [pv,setPv]=useState<any>(null);
  const saveC=async()=>{ await fetch('/api/lms/courses/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(course)}); await loadC(); };
  const saveP=async()=>{ await fetch('/api/lms/paths/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(path)}); await loadP(); };
  const loadC=async()=>{ const j=await (await fetch(`/api/lms/courses/${course.id}`)).json(); setCv(j); };
  const loadP=async()=>{ const j=await (await fetch(`/api/lms/paths/${path.key}`)).json(); setPv(j); };
  useEffect(()=>{ loadC(); loadP(); },[]);
  return <section><h2>LMS Catalog & Paths</h2>
    <div><input value={course.id} onChange={e=>setCourse({...course,id:e.target.value})}/><button onClick={saveC} style={{marginLeft:8}}>Save Course</button></div>
    <div style={{marginTop:8}}><input value={path.key} onChange={e=>setPath({...path,key:e.target.value})}/><button onClick={saveP} style={{marginLeft:8}}>Save Path</button></div>
    <textarea value={JSON.stringify(course,null,2)} onChange={e=>setCourse(JSON.parse(e.target.value))} style={{width:'100%',height:140,marginTop:8}}/>
    <textarea value={JSON.stringify(path,null,2)} onChange={e=>setPath(JSON.parse(e.target.value))} style={{width:'100%',height:140,marginTop:8}}/>
    {cv && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(cv,null,2)}</pre>}
    {pv && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(pv,null,2)}</pre>}
  </section>;
}
