import React, { useState } from 'react';

export default function Payroll_Tax(){
  const [year,setYear]=useState('2025'); const [quarter,setQuarter]=useState('3');
  const f941=async()=>{ const j=await (await fetch('/api/payroll/forms/941',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({year,quarter})})).json(); alert(j.file); };
  const w2=async()=>{ const j=await (await fetch('/api/payroll/forms/w2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({year})})).json(); alert(j.file); };
  const recent=async()=>{ const j=await (await fetch('/api/payroll/forms/recent')).json(); alert(JSON.stringify(j)); };
  return <section><h2>Payroll Forms</h2>
    <div><input value={year} onChange={e=>setYear(e.target.value)}/><input value={quarter} onChange={e=>setQuarter(e.target.value)} style={{marginLeft:8}}/><button onClick={f941} style={{marginLeft:8}}>941</button><button onClick={w2} style={{marginLeft:8}}>W-2</button><button onClick={recent} style={{marginLeft:8}}>Recent</button></div>
  </section>;
}

