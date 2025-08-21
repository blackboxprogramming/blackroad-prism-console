import roadmap from '../../../../docs/roadmap.json';

export default function Roadmap() {
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Roadmap</h2>
      <ul className="list-disc ml-5">
        {roadmap.milestones.map((m, i) => (
          <li key={i}>
            <strong>{m.name}</strong> — {m.when} — {m.status}
          </li>
        ))}
      </ul>
    </div>
  );
import { t } from '../lib/i18n.ts'
export default function Roadmap(){
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">{t('navRoadmap')}</h2>
      <p className="opacity-80">Roadmap coming soon.</p>
export default function Roadmap(){
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Roadmap</h2>
      <p>Content coming soon.</p>
    </div>
  )
}
