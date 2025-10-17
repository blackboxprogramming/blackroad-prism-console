import React, { useEffect, useState } from 'react';

export default function SUP_Tickets(){
  const [t,setT]=useState({ticketId:'T-1001',source:'email',subject:'Help needed',priority:'med',requester:{id:'u1',email:'user@example.com'},status:'new',tags:['billing']});
  const [msg,setMsg]=useState({ticketId:'T-1001',author:{id:'agent1',email:'agent@blackroad.io',role:'agent'},text:'We are looking into it.'});
  const [state,setState]=useState({ticketId:'T-1001',status:'open',assignee:'agent1'});
  const [view,setView]=useState<any>({});
  const create=async()=>{ await fetch('/api/support/tickets/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(t)}); await load(); };
  const add=async()=>{ await fetch('/api/support/messages/add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(msg)}); await load(); };
  const change=async()=>{ await fetch('/api/support/tickets/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)}); await load(); };
  const evalSla=async()=>{ await fetch('/api/support/sla/evaluate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticketId:t.ticketId})}); };
  const load=async()=>{ const j=await (await fetch(`/api/support/tickets/${t.ticketId}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Tickets & Conversations</h2>
    <div><button onClick={create}>Create</button><button onClick={add} style={{marginLeft:8}}>Add Message</button><button onClick={change} style={{marginLeft:8}}>Set State</button><button onClick={evalSla} style={{marginLeft:8}}>Evaluate SLA</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <textarea value={JSON.stringify(t,null,2)} onChange={e=>setT(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(msg,null,2)} onChange={e=>setMsg(JSON.parse(e.target.value))} style={{width:'100%',height:90,marginTop:8}}/>
    <textarea value={JSON.stringify(state,null,2)} onChange={e=>setState(JSON.parse(e.target.value))} style={{width:'100%',height:90,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>
  </section>;
}
