import { Link, useLocation } from 'react-router-dom'
import { t, localeFromPath, withPrefix } from '../lib/i18n.ts'

export default function Home(){
  const lang = localeFromPath(useLocation().pathname)
  return (
    <section className="grid grid-2">
      <div className="card">
        <h2 className="text-xl font-semibold mb-2">{t('quickCommands')}</h2>
        <ul className="list-disc ml-5">
          <li><code>/deploy blackroad pages</code> (or <code>vercel</code> / <code>cloudflare</code> / <code>staging</code>)</li>
          <li><code>/toggle ai off</code> &amp; <code>/toggle security off</code></li>
          <li><code>/fix</code>, <code>/lint</code>, <code>/bump deps</code>, <code>/release</code></li>
        </ul>
      </div>
      <div className="card">
        <h2 className="text-xl font-semibold mb-2">{t('explore')}</h2>
        <ul className="list-disc ml-5">
          <li><Link to={withPrefix('/portal', lang)}>{t('coCodingPortal')}</Link></li>
          <li><Link to={withPrefix('/status', lang)}>{t('status')}</Link> &nbsp; • &nbsp;<Link to={withPrefix('/snapshot', lang)}>{t('snapshot')}</Link></li>
          <li><Link to={withPrefix('/docs', lang)}>{t('docs')}</Link></li>
        </ul>
      </div>
    </section>
  )
}
