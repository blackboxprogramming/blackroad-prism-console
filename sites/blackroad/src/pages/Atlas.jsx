import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Atlas() {
  const nav = useNavigate()

  useEffect(() => {
    const role = localStorage.getItem('role')
    if (role !== 'admin') nav('/')
  }, [nav])
import { isAdminLikeRole } from '../lib/access.js'

export default function Atlas({ sessionRole } = {}) {
  const navigate = useNavigate()

  useEffect(() => {
    if (isAdminLikeRole(sessionRole)) {
      return
    }
    ;(async () => {
      try {
        const res = await fetch('/api/session', { cache: 'no-store' })
        if (!res.ok) throw new Error('session_lookup_failed')
        const data = await res.json()
        const role = data?.user?.role
        if (!isAdminLikeRole(role)) {
          navigate('/', { replace: true })
        }
      } catch {
        navigate('/', { replace: true })
      }
    })()
  }, [navigate, sessionRole])

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Atlas (Local)</h2>
      <p className="opacity-80">Embedding explorer loading…</p>
      <div id="atlas-root" className="h-[80vh] border mt-4" />
    </div>
  )
}
