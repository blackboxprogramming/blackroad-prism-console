import { useEffect, useState } from 'react'

export default function Snapshot() {
  const [data, setData] = useState(null)
  useEffect(() => { fetch('/snapshots/latest.json', { cache: 'no-cache' }).then(r=>r.json()).then(setData).catch(()=>{}) }, [])
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold mb-3">Homepage Snapshot</h2>
      {!data ? <p>No snapshot yet.</p> :
        <>
          <p className="opacity-70 mb-3">Updated: {data.updatedAt}</p>
          <img src="/snapshots/latest.png" alt="Latest homepage snapshot" className="rounded-lg border border-white/10" />
        </>
      }
    </section>
  )
}
