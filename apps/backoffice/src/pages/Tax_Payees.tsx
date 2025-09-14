import React, { useEffect, useState } from 'react';

export default function Tax_Payees(){
  const [payees,setPayees]=useState<any>({list:[]});
  const upsert=async()=>{ const id=prompt('Payee ID?')||''; const name=prompt('Name?')||''; const form='W9'; const country='US'; await fetch('/api/tax/payees/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,name,form,type:'US',country})}); await load(); };
  const pay=async()=>{ const payeeId=prompt('Payee ID?')||''; const amount=Number(prompt('Amount?','500')||'0'); const date=new Date().toISOString().slice(0,10); await fetch('/api/tax/payments/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payeeId,amount,date,type:'service'})}); };
  const load=async()=>{ const j=await (await fetch('/api/tax/files/recent')).json(); setPayees(j||{list:[]}); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Payees & Information Reporting</h2>
    <div><button onClick={upsert}>Upsert Payee</button><button onClick={pay} style={{marginLeft:8}}>Record Payment</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(payees,null,2)}</pre>
  </section>;
}
