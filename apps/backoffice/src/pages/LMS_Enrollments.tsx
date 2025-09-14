import React, { useEffect, useState } from 'react';

export default function LMS_Enrollments(){
  const [enroll,setEnroll]=useState({subjectId:'u1',courseId:'sec-awareness',assigned_by:'secops',due:new Date(Date.now()+14*86400000).toISOString().slice(0,10)});
  const [progress,setProgress]=useState({subjectId:'u1',courseId:'sec-awareness',moduleId:'m1',status:'completed'});
  const [list,setList]=useState<any>({});
  const doEnroll=async()=>{ await fetch('/api/lms/enroll',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(enroll)}); await load(); };
  const mark=async()=>{ await fetch('/api/lms/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(progress)}); };
  const load=async()=>{ const j=await (await fetch('/api/lms/enrollments?subjectId=u1')).json(); setList(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Enrollments & Progress</h2>
    <div><button onClick={doEnroll}>Enroll</button><button onClick={mark} style={{marginLeft:8}}>Mark Progress</button><button onClick={load} style={{marginLeft:8}}>List</button></div>
    <textarea value={JSON.stringify(enroll,null,2)} onChange={e=>setEnroll(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(progress,null,2)} onChange={e=>setProgress(JSON.parse(e.target.value))} style={{width:'100%',height:110,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(list,null,2)}</pre>
  </section>;
}
