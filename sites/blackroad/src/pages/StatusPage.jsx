import { t } from '../lib/i18n.ts'
export default function StatusPage(){
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">{t('status')}</h2>
      <p className="opacity-80">Status details coming soon.</p>
    </div>
  )
}
