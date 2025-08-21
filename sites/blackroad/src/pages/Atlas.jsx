import { useEffect } from 'react'

export default function Atlas() {
  useEffect(() => {
    // TODO: enforce RBAC so only admins can access this route
  }, [])

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Atlas (Local)</h2>
      <p className="opacity-80">Embedding explorer loading…</p>
      <div id="atlas-root" className="h-[80vh] border mt-4" />
    </div>
  )
}
