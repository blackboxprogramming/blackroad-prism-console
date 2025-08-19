const tutorials = [
  {
    title: 'Ship with Pages',
    steps: ['/deploy blackroad pages', 'Set BLACKROAD_DOMAIN', 'Merge to main'],
  },
  {
    title: 'Turn off AI tools',
    steps: ['/toggle ai off', 'Commit feature-flags.yml change', 'Rerun CI'],
  },
  {
    title: 'Fix failing lint',
    steps: ['/fix', 'Prettier formats', 'ESLint is advisory'],
  },
];

export default function Tutorials() {
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Tutorials</h2>
      <ul className="list-disc ml-5">
        {tutorials.map((t, i) => (
          <li key={i} className="mb-3">
            <strong>{t.title}</strong>
            <ol className="list-decimal ml-6">
              {t.steps.map((s, ii) => (
                <li key={ii}>
                  <code>{s}</code>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
    </div>
  );
import { t } from '../lib/i18n.ts'
export default function Tutorials(){
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">{t('navTutorials')}</h2>
      <p className="opacity-80">Tutorials coming soon.</p>
    </div>
  )
}
