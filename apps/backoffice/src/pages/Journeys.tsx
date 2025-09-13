import React, { useState } from 'react';

export default function Journeys(){
  const [name,setName]=useState('Onboarding'); const [graph,setGraph]=useState<any>({nodes:[{id:'start',type:'wait',min:3600},{id:'sendA',type:'send',channel:'email',template:'welcome'}],edges:[['start','sendA']]});
  const create=async()=>{ const j=await (await fetch('/api/mkt/journeys/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,graph})})).json(); alert('Created '+j.id); };
  const trigger=async()=>{ const subjectId=prompt('Subject ID?')||''; await fetch('/api/mkt/journeys/trigger',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({journeyId:'manual',subjectId})}); alert('Triggered'); };
  return <section><h2>Journeys</h2>
    <input value={name} onChange={e=>setName(e.target.value)} />
    <textarea value={JSON.stringify(graph,null,2)} onChange={e=>setGraph(JSON.parse(e.target.value))} style={{width:'100%',height:160,marginTop:8}}/>
    <div><button onClick={create}>Create</button><button onClick={trigger} style={{marginLeft:8}}>Trigger</button></div>
  </section>;
}
