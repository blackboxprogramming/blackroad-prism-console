import { t } from '../lib/i18n.ts'
export default function Tutorials(){
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">{t('navTutorials')}</h2>
      <p className="opacity-80">Tutorials coming soon.</p>
    </div>
  )
}
