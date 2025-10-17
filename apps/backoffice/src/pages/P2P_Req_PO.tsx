import React, { useState } from 'react';

export default function P2P_Req_PO(){
  const [reqId,setReqId]=useState('REQ-1'); const [poId,setPoId]=useState('PO-1');
  const makeReq=async()=>{ const body={reqId,requester:'alice',cost_center:'ENG',lines:[{sku:'ITM-1',qty:5,est_price:10}],justification:'Starter kit'}; await fetch('/api/p2p/req/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); };
  const makePO=async()=>{ const body={reqId,vendorId:'VEND-1',poId,lines:[{sku:'ITM-1',qty:5,price:9.5}],currency:'USD'}; await fetch('/api/p2p/po/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); };
  const viewPO=async()=>{ const j=await (await fetch(`/api/p2p/po/${poId}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>Requisitions & POs</h2>
    <div><input placeholder="REQ" value={reqId} onChange={e=>setReqId(e.target.value)}/><button onClick={makeReq} style={{marginLeft:8}}>Create REQ</button></div>
    <div style={{marginTop:8}}><input placeholder="PO" value={poId} onChange={e=>setPoId(e.target.value)}/><button onClick={makePO} style={{marginLeft:8}}>Create PO</button><button onClick={viewPO} style={{marginLeft:8}}>View PO</button></div>
  </section>;
}
