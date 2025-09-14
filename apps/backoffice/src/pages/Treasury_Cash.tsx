import React, { useEffect, useState } from 'react';

export default function Treasury_Cash(){
  const [banks,setBanks]=useState<any>({banks:[]}); const [ladder,setLadder]=useState<any>({});
  const upsert=async()=>{ const id=prompt('Bank ID?')||''; const name=prompt('Name?')||''; const currency=prompt('Currency?','USD')||'USD'; const balance=Number(prompt('Balance?','1000000')||'0'); await fetch('/api/treasury/banks/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,name,currency,balance})}); await load(); };
  const setcash=async()=>{ const buckets={'0-7d':100000,'8-30d':200000,'31-90d':300000,'90d+':400000}; await fetch('/api/treasury/cash/ladder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({buckets})}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/treasury/cash/snapshot')).json(); setBanks(j.banks); setLadder(j.ladder); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Cash & Liquidity</h2>
    <div><button onClick={upsert}>Upsert Bank</button><button onClick={setcash} style={{marginLeft:8}}>Set Cash Ladder</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify({banks,ladder},null,2)}</pre>
  </section>;
}
