import { useEffect, useState } from 'react'
export default function StatusPage(){
  const [s, setS] = useState(null)
  useEffect(()=>{ fetch('/status.json',{cache:'no-cache'}).then(r=>r.json()).then(setS).catch(()=>setS({})) },[])
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Status</h2>
      {!s ? <p>Loading…</p> : (
        <ul className="list-disc ml-5">
          <li>Last update: <code>{s.ts || 'n/a'}</code></li>
          <li>Commit: <code>{(s.ref||'').slice(0,7) || 'n/a'}</code></li>
          <li>Run: <code>{s.run || 'n/a'}</code></li>
        </ul>
      )}
    </div>
  )
}
