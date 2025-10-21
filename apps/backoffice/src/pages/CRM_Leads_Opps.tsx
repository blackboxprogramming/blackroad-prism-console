
import React, { useState } from 'react';

export default function CRM_Leads_Opps(){
  const [lead,setLead]=useState({leadId:'L-1',name:'Grace Hopper',email:'grace@example.com',source:'web'});
  const createLead=async()=>{ await fetch('/api/crm/leads/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(lead)}); };
  const convertLead=async()=>{ const o={id:'O-1',amount:50000,stage:'Qualification',close_date:new Date().toISOString().slice(0,10),owner:'rep1',products:[]}; await fetch('/api/crm/leads/convert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({leadId:lead.leadId,opportunity:o})}); };
  const [opp,setOpp]=useState({id:'O-1',accountId:'A-1',stage:'Proposal',amount:60000,currency:'USD',close_date:new Date().toISOString().slice(0,10),owner:'rep1',probability:0.6,type:'new',products:[]});
  const upsertOpp=async()=>{ await fetch('/api/crm/opps/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(opp)}); };
  const viewOpp=async()=>{ const j=await (await fetch(`/api/crm/opps/${opp.id}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>Leads & Opportunities</h2>
    <div><input value={lead.leadId} onChange={e=>setLead({...lead,leadId:e.target.value})}/><input value={lead.name} onChange={e=>setLead({...lead,name:e.target.value})} style={{marginLeft:8}}/><input value={lead.email} onChange={e=>setLead({...lead,email:e.target.value})} style={{marginLeft:8}}/><button onClick={createLead} style={{marginLeft:8}}>Create Lead</button><button onClick={convertLead} style={{marginLeft:8}}>Convert</button></div>
    <div style={{marginTop:8}}><input value={opp.id} onChange={e=>setOpp({...opp,id:e.target.value})}/><input value={opp.accountId} onChange={e=>setOpp({...opp,accountId:e.target.value})} style={{marginLeft:8}}/><input value={opp.stage} onChange={e=>setOpp({...opp,stage:e.target.value})} style={{marginLeft:8}}/><input type="number" value={opp.amount} onChange={e=>setOpp({...opp,amount:Number(e.target.value)})} style={{marginLeft:8,width:120}}/><button onClick={upsertOpp} style={{marginLeft:8}}>Upsert Opp</button><button onClick={viewOpp} style={{marginLeft:8}}>View</button></div>
  </section>;
}

