export default function Changelog() {
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Changelog</h2>
      <p>
        See{' '}
        <a href="/CHANGELOG.md" className="underline">
          CHANGELOG.md
        </a>{' '}
        for recent changes.
      </p>
    </div>
  );
import { t } from '../lib/i18n.ts'
export default function Changelog(){
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">{t('navChangelog')}</h2>
      <p className="opacity-80">Changelog coming soon.</p>
    </div>
  )
}
