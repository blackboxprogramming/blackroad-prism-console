import React from 'react';

export default function FA_Capex(){
  const approve=async()=>{ const capexId=prompt('Capex ID?')||''; const amount=Number(prompt('Amount?','5000')||'0'); const project=prompt('Project?','DataCenter')||'DataCenter'; await fetch('/api/fa/capex/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({capexId,amount,project,approved_by:'CFO'})}); };
  const allocate=async()=>{ const capexId=prompt('Capex ID?')||''; const assetId=prompt('Asset ID?')||''; const amount=Number(prompt('Amount?','5000')||'0'); await fetch('/api/fa/capex/allocate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({capexId,assetId,amount})}); };
  return <section><h2>Capex</h2>
    <div><button onClick={approve}>Approve</button><button onClick={allocate} style={{marginLeft:8}}>Allocate</button></div>
  </section>;
}
