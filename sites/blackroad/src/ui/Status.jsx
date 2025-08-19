import { useEffect, useState } from 'react'

export default function Status() {
  const [data, setData] = useState(null)
  useEffect(() => { fetch('/api/health.json', { cache: 'no-cache' }).then(r=>r.json()).then(setData).catch(()=>{}) }, [])
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold mb-3">Status</h2>
      {!data ? <p>No status yet.</p> :
        <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
      }
    </section>
  )
}
