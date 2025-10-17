import React, { useEffect, useState } from 'react';

export default function LMS_Reports(){
  const [comp,setComp]=useState('No compliance report'); const [train,setTrain]=useState('No training report');
  const load=async()=>{ try{ const c=await (await fetch('/lms/reports/COMPLIANCE_000000.md')).text(); setComp(c);}catch{} try{ const t=await (await fetch('/lms/reports/TRAINING_000000.md')).text(); setTrain(t);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>LMS Reports</h2>
    <h3>Compliance</h3><pre style={{background:'#f7f7f7',padding:8}}>{comp}</pre>
    <h3>Training</h3><pre style={{background:'#f7f7f7',padding:8}}>{train}</pre>
  </section>;
}
