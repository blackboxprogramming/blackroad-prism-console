import { useEffect, useState } from 'react'

export default function Status() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch('/status.json', { cache: 'no-cache' })
      .then(r => r.json())
      .then(setData)
      .catch(() => setData({ error: 'unavailable' }))
  }, [])
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold mb-3">Status</h2>
      {!data ? <p>Loading…</p> :
        data.error ? <p className="text-red-300">Status unavailable</p> :
        <>
          <p className="opacity-70 mb-3">Last update: {data.timestamp}</p>
          <table className="w-full text-sm">
            <thead><tr className="opacity-70"><th className="text-left">Name</th><th className="text-left">URL</th><th>Status</th></tr></thead>
            <tbody>
              {data.checks?.map((c,i)=>(
                <tr key={i} className="border-t border-white/10">
                  <td className="py-2">{c.name}</td>
                  <td className="py-2 break-all"><a className="underline" href={c.url}>{c.url}</a></td>
                  <td className="py-2">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      }
    </section>
  )
}
