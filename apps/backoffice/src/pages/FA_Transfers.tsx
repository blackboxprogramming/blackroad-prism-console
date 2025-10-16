import React from 'react';

export default function FA_Transfers(){
  const transfer=async()=>{ const assetId=prompt('Asset?')||''; const from_loc=prompt('From?','HQ')||'HQ'; const to_loc=prompt('To?','DC')||'DC'; await fetch('/api/fa/transfer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assetId,from_loc,to_loc,date:new Date().toISOString().slice(0,10)})}); };
  const impair=async()=>{ const assetId=prompt('Asset?')||''; const amount=Number(prompt('Amount?','100')||'0'); await fetch('/api/fa/impair',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assetId,amount,reason:'manual',date:new Date().toISOString().slice(0,10)})}); };
  return <section><h2>Transfers & Impairments</h2>
    <div><button onClick={transfer}>Transfer</button><button onClick={impair} style={{marginLeft:8}}>Impair</button></div>
  </section>;
}
