import React, { useEffect, useState } from 'react';

export default function MarketplaceReview(){
  const [apps,setApps] = useState<any[]>([]);
  const [pending,setPending] = useState<any[]>([]);
  useEffect(()=>{
    fetch('/api/marketplace/list').then(r=>r.json()).then(d=>setApps(d.apps||[]));
    // naive: pretend pending = visible:false (admin-only endpoint omitted for brevity)
    fetch('/api/partners/list-pending').catch(()=>Promise.resolve({json:()=>({apps:[]})})).then((r:any)=>r.json?.()||{apps:[]}).then((d:any)=>setPending(d.apps||[])).catch(()=>setPending([]));
  },[]);
  return <section>
    <h2>Marketplace Review</h2>
    <h3>Visible Apps</h3>
    <ul>{apps.map(a=><li key={a.id}>{a.name} <code>{a.slug}</code></li>)}</ul>
    <h3>Pending Approval</h3>
    <ul>{pending.map((a:any)=><li key={a.id}>{a.name} <button onClick={()=>fetch(`/api/partners/app/${a.id}/approve`,{method:'POST'}).then(()=>alert('approved'))}>Approve</button></li>)}</ul>
  </section>;
}
