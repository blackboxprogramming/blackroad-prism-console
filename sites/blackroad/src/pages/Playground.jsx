import { t } from '../lib/i18n.ts'
export default function Playground(){
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">{t('navPlayground')}</h2>
      <p className="opacity-80">Playground coming soon.</p>
    </div>
  )
}
