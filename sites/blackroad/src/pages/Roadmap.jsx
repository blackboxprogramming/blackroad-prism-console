import { t } from '../lib/i18n.ts'
export default function Roadmap(){
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">{t('navRoadmap')}</h2>
      <p className="opacity-80">Roadmap coming soon.</p>
    </div>
  )
}
