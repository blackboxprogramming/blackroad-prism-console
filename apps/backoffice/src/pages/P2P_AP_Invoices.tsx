import React, { useState } from 'react';

export default function P2P_AP_Invoices(){
  const [invId,setInvId]=useState('INV-AP-1'); const [poId,setPoId]=useState('PO-1');
  const capture=async()=>{ const body={invId,vendorId:'VEND-1',poId,total:47.5,currency:'USD',date:new Date().toISOString().slice(0,10),lines:[{sku:'ITM-1',qty:5,price:9.5}]}; await fetch('/api/p2p/ap/invoice/capture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); };
  const match=async()=>{ const j=await (await fetch('/api/p2p/ap/match/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invId})})).json(); alert(JSON.stringify(j)); };
  const approve=async()=>{ await fetch('/api/p2p/ap/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invId,approver:'bob'})}); };
  const exportF=async()=>{ await fetch('/api/p2p/ap/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invId,format:'erp'})}); };
  const view=async()=>{ const j=await (await fetch(`/api/p2p/ap/invoice/${invId}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>AP Invoices & 3-Way Match</h2>
    <div><input value={invId} onChange={e=>setInvId(e.target.value)}/><input value={poId} onChange={e=>setPoId(e.target.value)} style={{marginLeft:8}}/>
      <button onClick={capture} style={{marginLeft:8}}>Capture</button><button onClick={match} style={{marginLeft:8}}>Match</button><button onClick={approve} style={{marginLeft:8}}>Approve</button><button onClick={exportF} style={{marginLeft:8}}>Export</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
  </section>;
}
