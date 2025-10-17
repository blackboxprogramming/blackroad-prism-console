import React, { useEffect, useState } from 'react';

export default function CPQ_Quotes(){
  const [id,setId]=useState(''); const [view,setView]=useState<any>(null);
  const create=async()=>{ const customer=prompt('Customer?')||''; const lines=[{sku:'BR-PRO',qty:5}]; const j=await (await fetch('/api/cpq/quote/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer,lines,validUntil:new Date(Date.now()+30*86400000).toISOString().slice(0,10)})})).json(); setId(j.id); };
  const price=async()=>{ await fetch('/api/cpq/quote/price',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}); await load(); };
  const discount=async()=>{ const percent=Number(prompt('Discount %?','20')||'0'); await fetch('/api/cpq/quote/discount',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,percent})}); await load(); };
  const state=async(s:string)=>{ await fetch('/api/cpq/quote/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,state:s})}); await load(); };
  const load=async()=>{ if(!id) return; const j=await (await fetch(`/api/cpq/quote/${id}`)).json(); setView(j); };
  useEffect(()=>{ if(id) load(); },[id]);
  return <section><h2>Quotes</h2>
    <div><button onClick={create}>Create</button><input placeholder="Quote ID" value={id} onChange={e=>setId(e.target.value)} style={{marginLeft:8}}/><button onClick={price} style={{marginLeft:8}}>Price</button><button onClick={discount} style={{marginLeft:8}}>Request Discount</button>
      <button onClick={()=>state('approved')} style={{marginLeft:8}}>Approve</button><button onClick={()=>state('sent')} style={{marginLeft:8}}>Send</button><button onClick={()=>state('signed')} style={{marginLeft:8}}>Mark Signed</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{view?JSON.stringify(view,null,2):'No quote loaded'}</pre>
  </section>;
}
