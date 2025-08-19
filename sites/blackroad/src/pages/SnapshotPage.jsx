export default function SnapshotPage() {
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Snapshot</h2>
      <p>Recent snapshots will appear here.</p>
    </div>
  );
import { t } from '../lib/i18n.ts'
export default function SnapshotPage(){
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">{t('snapshot')}</h2>
      <p className="opacity-80">Snapshot content coming soon.</p>
    </div>
  )
}
