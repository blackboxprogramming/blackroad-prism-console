import React, { useState } from 'react';

export default function Expenses_Reports(){
  const [reportId,setReportId]=useState('ER-1');
  const create=async()=>{ const lines=[{type:'meal',amount:25,currency:'USD',date:new Date().toISOString().slice(0,10)}]; await fetch('/api/expenses/report/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reportId,employee:'alice',cost_center:'ENG',lines})}); };
  const submit=async()=>{ await fetch('/api/expenses/report/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reportId})}); };
  const approve=async()=>{ await fetch('/api/expenses/report/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reportId,approver:'manager'})}); };
  const view=async()=>{ const j=await (await fetch(`/api/expenses/report/${reportId}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>T&E Expense Reports</h2>
    <div><input value={reportId} onChange={e=>setReportId(e.target.value)}/><button onClick={create} style={{marginLeft:8}}>Create</button><button onClick={submit} style={{marginLeft:8}}>Submit</button><button onClick={approve} style={{marginLeft:8}}>Approve</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
  </section>;
}
