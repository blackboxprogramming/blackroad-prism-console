import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Atlas() {
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/session', { cache: 'no-store' })
        const data = await res.json()
        const role = data?.user?.role
        if (!role || !['admin', 'dev'].includes(role)) {
          navigate('/', { replace: true })
        }
      } catch {
        navigate('/', { replace: true })
      }
    })()
  }, [navigate])

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Atlas (Local)</h2>
      <p className="opacity-80">Embedding explorer loading…</p>
      <div id="atlas-root" className="h-[80vh] border mt-4" />
    </div>
  )
}
