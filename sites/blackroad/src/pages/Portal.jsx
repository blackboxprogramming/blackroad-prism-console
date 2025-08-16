import { t } from '../lib/i18n.ts'
export default function Portal(){
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">{t('navPortal')}</h2>
      <p className="opacity-80">Co-coding portal coming soon.</p>
    </div>
  )
}
