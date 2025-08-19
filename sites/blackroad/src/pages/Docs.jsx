export default function Docs() {
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Docs</h2>
      <p>Documentation coming soon.</p>
    </div>
  );
import { useEffect, useState } from 'react'
import FlagsPanel from '../ui/FlagsPanel.jsx'
import { t } from '../lib/i18n.ts'
export default function Docs(){
  const [docs,setDocs]=useState(null)
  useEffect(()=>{ fetch('/docs/index.json').then(r=>r.json()).then(d=>setDocs(d.docs)).catch(()=>setDocs([])) },[])
  return (
    <div className="grid grid-2">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">{t('docs')}</h2>
        {!docs ? <p>{t('loading')}</p> : docs.length===0 ? <p>{t('noDocs')}</p> :
          <ul className="list-disc ml-5">
            {docs.map(d=> <li key={d.slug}><a className="underline" href={`/docs/${d.slug}.json`}>{d.title}</a> <span className="opacity-60">({d.section})</span></li>)}
          </ul>}
      </div>
      <FlagsPanel />
export default function Docs(){
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Docs</h2>
      <p>Content coming soon.</p>
    </div>
  )
}
