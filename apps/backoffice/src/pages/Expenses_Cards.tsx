import React from 'react';

export default function Expenses_Cards(){
  const ingest=async()=>{ const payload={feedId:'BANK-FEED-1',items:[{card:'XXXX-1234',last4:'1234',txnId:'T1',amount:75,ccy:'USD',merchant:'CoffeeCo',date:new Date().toISOString().slice(0,10)}]}; await fetch('/api/expenses/cards/ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); };
  const allocate=async()=>{ await fetch('/api/expenses/cards/allocate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({txnId:'T1',reportId:'ER-1',category:'meal'})}); };
  const recent=async()=>{ const j=await (await fetch('/api/expenses/cards/recent?feedId=BANK-FEED-1')).json(); alert(JSON.stringify(j)); };
  return <section><h2>Corporate Cards</h2>
    <div><button onClick={ingest}>Ingest Feed</button><button onClick={allocate} style={{marginLeft:8}}>Allocate</button><button onClick={recent} style={{marginLeft:8}}>Recent</button></div>
  </section>;
}
