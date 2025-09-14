import React from 'react';

export default function P2P_Receiving(){
  const receive=async()=>{ const poId=prompt('PO?')||''; const grn='GRN-1'; const lines=[{sku:'ITM-1',qty_received:5}]; await fetch('/api/p2p/receipt/log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({poId,grn,lines,date:new Date().toISOString().slice(0,10)})}); };
  return <section><h2>Receiving</h2>
    <div><button onClick={receive}>Log Receipt</button></div>
  </section>;
}
