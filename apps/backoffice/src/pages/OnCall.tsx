import React, { useEffect, useState } from 'react';

export default function OnCall(){
  const [team,setTeam] = useState('platform');
  const [info,setInfo] = useState<any>({});
  const [summary,setSummary] = useState('');

  const load = async () => {
    const j = await (await fetch(`/api/itsm/oncall/${team}/now`)).json();
    setInfo(j);
  };
  const page = async () => {
    await fetch('/api/itsm/page',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ team, severity:'Sev-2', summary, details:'' }) });
    alert('paged');
  };

  useEffect(()=>{ load(); },[team]);

  return <section>
    <h2>On-Call</h2>
    <div>
      Team:
      <select value={team} onChange={e=>setTeam(e.target.value)} style={{marginLeft:8}}>
        <option value="platform">platform</option>
      </select>
      <button onClick={load} style={{marginLeft:8}}>Refresh</button>
    </div>
    <div style={{marginTop:8}}>
      <b>Primary:</b> {info.primary || 'n/a'}
    </div>
    <div style={{marginTop:12}}>
      <input placeholder="Incident summary" value={summary} onChange={e=>setSummary(e.target.value)} />
      <button onClick={page} style={{marginLeft:8}}>Page</button>
    </div>
  </section>;
}
