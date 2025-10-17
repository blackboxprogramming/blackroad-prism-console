import React, { useEffect, useState } from 'react';

export default function Reviews(){
  const [cycle,setCycle]=useState(''); const [packets,setPackets]=useState<any[]>([]);
  const createCycle=async()=>{ const name=prompt('Cycle name?')||''; const start=prompt('Start (YYYY-MM-DD)?')||''; const end=prompt('End (YYYY-MM-DD)?')||''; const j=await (await fetch('/api/hr/reviews/cycle',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,start,end})})).json(); setCycle(j.id); };
  const assign=async()=>{ const employeeId=prompt('Employee ID/email?')||''; await fetch('/api/hr/reviews/packet',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cycleId:cycle,employeeId})}); await load(); };
  const feedback=async(id:string)=>{ const text=prompt('Feedback?')||''; await fetch('/api/hr/reviews/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({packetId:id,authorId:'manager',text})}); };
  const finalize=async(id:string)=>{ const rating=prompt('Rating (1-5)?')||'3'; await fetch('/api/hr/reviews/finalize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({packetId:id,rating})}); await load(); };
  const load=async()=>{ if(!cycle) return; const j=await (await fetch(`/api/hr/reviews/packets?cycleId=${cycle}`)).json(); setPackets(j.items||[]); };
  useEffect(()=>{ if(cycle) load(); },[cycle]);
  return <section><h2>Performance Reviews</h2><div><button onClick={createCycle}>Create Cycle</button><input placeholder="Cycle ID" value={cycle} onChange={e=>setCycle(e.target.value)} style={{marginLeft:8}}/><button onClick={load} style={{marginLeft:8}}>Load</button><button onClick={assign} style={{marginLeft:8}}>Assign Packet</button></div>
    <ul>{packets.map((p:any)=><li key={p.id}>{p.employeeId} — {p.status||''} <button onClick={()=>feedback(p.id)}>Feedback</button> <button onClick={()=>finalize(p.id)}>Finalize</button></li>)}</ul>
  </section>;
}
