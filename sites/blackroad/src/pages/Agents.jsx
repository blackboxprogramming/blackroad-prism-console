import { useEffect, useState } from 'react';

const AGENTS = [
  { id: 'frontend', name: 'Frontend (SPA)' },
  { id: 'api', name: 'API (blackroad-api)' },
  { id: 'llm', name: 'Lucidia LLM' },
  { id: 'math', name: 'Infinity Math' }
];

function indicator(status){
  if(status === 'OK') return '🟢';
  if(status === 'Degraded') return '🟡';
  if(!status) return '⚪️';
  return '🔴';
}

export default function Agents(){
  const [summary,setSummary]=useState({});
  const [logs,setLogs]=useState([]);
  const [active,setActive]=useState('');
  const [snapshots,setSnapshots]=useState({});
  const [selected,setSelected]=useState({});

  async function load(){
    try{ const r = await fetch('/api/agents/summary'); const j = await r.json(); setSummary(j); }catch{}
  }

  useEffect(()=>{
    load();
    const t=setInterval(load,15000);
    const ws = new WebSocket(`${location.origin.replace('http','ws')}/ws/agents`);
    ws.onmessage = e=>{ try{ const d=JSON.parse(e.data); setSummary(s=>({...s,...d})); }catch{} };
    return ()=>{ clearInterval(t); ws.close(); };
  },[]);

  async function viewLogs(id){
    try {
      const r = await fetch(`/api/agents/${id}/logs?limit=50`);
      const j = await r.json();
      setLogs(j.logs || []);
      setActive(id);
    } catch {}
  }
  const closeLogs=()=>{ setActive(''); setLogs([]); };
  const restart=id=>{ fetch(`/autoheal/restart/${id}`,{method:'POST'}).catch(()=>{}); };
  async function loadSnapshots(id){
    try{ const r=await fetch(`/api/agents/${id}/snapshots`); const j=await r.json(); setSnapshots(s=>({...s,[id]:j.snapshots||[]})); }catch{}
  }
  async function snapshotAgent(id){
    try{ await fetch(`/api/agents/${id}/snapshot`,{method:'POST'}); alert(`Snapshot saved for agent ${id} (${new Date().toLocaleTimeString()})`); loadSnapshots(id); }catch{}
  }
  async function rollbackAgent(id){
    const snap=selected[id];
    if(!snap) return;
    if(!window.confirm(`Rollback ${id} to snapshot ${snap}?`)) return;
    try{ await fetch(`/api/agents/${id}/rollback/${snap}`,{method:'POST'}); alert(`Agent ${id} rolled back to snapshot ${snap}`); }catch{}
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {AGENTS.map(a=>{
        const info=summary[a.id]||{};
        return (
          <div key={a.id} className="card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{a.name}</div>
              <span>{indicator(info.status)}</span>
            </div>
            <div className="text-sm text-neutral-400">Status: {info.status||'Unknown'}</div>
            <div className="text-sm text-neutral-400">Uptime: {info.uptime||'-'}</div>
            <div className="text-sm text-neutral-400">Errors: {info.errors ?? 0}</div>
            {info.contradictions!==undefined && <div className="text-sm text-neutral-400">Contradictions: {info.contradictions}</div>}
            <div className="mt-2 flex flex-wrap gap-2">
              <button className="btn" onClick={()=>restart(a.id)}>Restart</button>
              <button className="btn" onClick={()=>viewLogs(a.id)}>Logs</button>
              <button className="btn" onClick={()=>snapshotAgent(a.id)}>Snapshot</button>
              <select className="select" value={selected[a.id]||''} onFocus={()=>loadSnapshots(a.id)} onChange={e=>setSelected(s=>({...s,[a.id]:e.target.value}))}>
                <option value="">Snapshots</option>
                {(snapshots[a.id]||[]).map(s=> <option key={s.id||s} value={s.id||s}>{s.label||s}</option>)}
              </select>
              <button className="btn" disabled={!selected[a.id]} onClick={()=>rollbackAgent(a.id)}>Rollback</button>
            </div>
          </div>
        );
      })}

      {active && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center" onClick={closeLogs}>
          <div className="bg-neutral-900 p-4 rounded max-w-lg w-full max-h-[80vh] overflow-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{active} logs</div>
              <button className="btn" onClick={closeLogs}>Close</button>
            </div>
            <pre className="text-xs whitespace-pre-wrap">
{logs.map(l=>`${l.created_at}: ${l.message}`).join('\n')}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
