import React, { useEffect, useState } from 'react';

export default function LMS_Quizzes(){
  const [quiz,setQuiz]=useState({id:'q-sec',courseId:'sec-awareness',questions:[{qid:'q1',type:'single',prompt:'Is phishing bad?',options:['yes','no'],answer:'yes'}],pass_pct:100});
  const [submit,setSubmit]=useState({quizId:'q-sec',subjectId:'u1',answers:{q1:'yes'}});
  const [results,setResults]=useState<any>({});
  const save=async()=>{ await fetch('/api/lms/quizzes/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(quiz)}); };
  const doSubmit=async()=>{ const j=await (await fetch('/api/lms/quizzes/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(submit)})).json(); alert(JSON.stringify(j)); };
  const view=async()=>{ const j=await (await fetch('/api/lms/quizzes/results?quizId=q-sec&subjectId=u1')).json(); setResults(j); };
  useEffect(()=>{ view(); },[]);
  return <section><h2>Quizzes & Assessments</h2>
    <div><button onClick={save}>Save Quiz</button><button onClick={doSubmit} style={{marginLeft:8}}>Submit</button><button onClick={view} style={{marginLeft:8}}>Results</button></div>
    <textarea value={JSON.stringify(quiz,null,2)} onChange={e=>setQuiz(JSON.parse(e.target.value))} style={{width:'100%',height:140,marginTop:8}}/>
    <textarea value={JSON.stringify(submit,null,2)} onChange={e=>setSubmit(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(results,null,2)}</pre>
  </section>;
}
