import React, { useEffect, useState } from 'react';

export default function Payroll_Employees(){
  const [e,setE]=useState({id:'E-100',name:'Alex Doe',ssn:'***-**-1234',country:'US',state:'CA',pay_type:'salary',rate:9000,currency:'USD',bank:{routing:'000000000',account:'000123456',type:'checking'},tax:{filing_status:'single',allowances:0},benefits:{medical:250,dental:50},start_date:'2025-01-01'});
  const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/payroll/employees/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(e)}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/payroll/employees/${e.id}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Employees & Pay Profiles</h2>
    <div><input value={e.id} onChange={ev=>setE({...e,id:ev.target.value})}/><input value={e.name} onChange={ev=>setE({...e,name:ev.target.value})} style={{marginLeft:8}}/><input value={e.pay_type} onChange={ev=>setE({...e,pay_type:ev.target.value})} style={{marginLeft:8}}/><input type="number" value={e.rate} onChange={ev=>setE({...e,rate:Number(ev.target.value)})} style={{marginLeft:8,width:110}}/><button onClick={save} style={{marginLeft:8}}>Save</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}

