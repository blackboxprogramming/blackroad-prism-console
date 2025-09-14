import React, { useEffect, useState } from 'react';

export default function CS_Accounts(){
  const [accountId,setAccountId]=useState('A-1');
  const [usage,setUsage]=useState('{"accountId":"A-1","period":"2025-09","dau7":120,"mau":300,"events":5000}');
  const [support,setSupport]=useState('{"accountId":"A-1","period":"2025-09","open_tickets":2,"sla_breaches":0}');
  const [finance,setFinance]=useState('{"accountId":"A-1","arr":120000,"ar_overdue":0}');
  const [nps,setNps]=useState('{"accountId":"A-1","respondent":"ops@acme.com","score":9,"comment":"great"}');
  const send=async(path:string,body:string)=>{ await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body}); };
  const recent=async()=>{ const j=await (await fetch(`/api/cs/signals/recent?accountId=${accountId}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>CS Accounts (Signals)</h2>
    <div><input value={accountId} onChange={e=>setAccountId(e.target.value)}/><button onClick={()=>recent()} style={{marginLeft:8}}>Recent</button></div>
    <h4>Usage</h4><textarea value={usage} onChange={e=>setUsage(e.target.value)} style={{width:'100%',height:90}}/><button onClick={()=>send('/api/cs/signals/usage',usage)}>Send</button>
    <h4>Support</h4><textarea value={support} onChange={e=>setSupport(e.target.value)} style={{width:'100%',height:90}}/><button onClick={()=>send('/api/cs/signals/support',support)}>Send</button>
    <h4>Finance</h4><textarea value={finance} onChange={e=>setFinance(e.target.value)} style={{width:'100%',height:90}}/><button onClick={()=>send('/api/cs/signals/finance',finance)}>Send</button>
    <h4>NPS</h4><textarea value={nps} onChange={e=>setNps(e.target.value)} style={{width:'100%',height:90}}/><button onClick={()=>send('/api/cs/signals/nps',nps)}>Send</button>
  </section>;
}
