import React from 'react';

export default function AR_Disputes(){
  const open=async()=>{ const invoiceId=prompt('Invoice?')||''; const reason=prompt('Reason?')||''; const amount=Number(prompt('Amount?','10')||'0'); await fetch('/api/ar/dispute/open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invoiceId,reason,amount})}); };
  const resolve=async()=>{ const disputeId=prompt('Dispute ID?')||''; const outcome=prompt('Outcome (upheld|reversed|partial)?','partial')||'partial'; await fetch('/api/ar/dispute/resolve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({disputeId,outcome,notes:'resolved'})}); };
  const recent=async()=>{ const j=await (await fetch('/api/ar/dispute/recent')).json(); alert(JSON.stringify(j)); };
  return <section><h2>Disputes & Write-offs</h2>
    <div><button onClick={open}>Open</button><button onClick={resolve} style={{marginLeft:8}}>Resolve</button><button onClick={recent} style={{marginLeft:8}}>Recent</button></div>
  </section>;
}
