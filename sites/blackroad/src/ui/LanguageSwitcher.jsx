import { locales, getLocale, setLocale, withPrefix } from '../lib/i18n.ts'
import { useNavigate, useLocation } from 'react-router-dom'
export default function LanguageSwitcher() {
  const nav = useNavigate()
  const loc = useLocation()
  const current = getLocale()
  return (
    <select
      aria-label="Language"
      className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
      value={current}
      onChange={e => {
        const next = e.target.value
        setLocale(next)
        const parts = loc.pathname.split('/').filter(Boolean)
        if (locales.includes(parts[0])) parts.shift()
        const nextPath = '/' + parts.join('/')
        nav(withPrefix(nextPath || '/', next) + loc.search + loc.hash)
      }}>
      {locales.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
    </select>
  )
}
