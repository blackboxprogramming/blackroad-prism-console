import Link from 'next/link';
import { DashboardPayload } from '@/features/dashboard-api';

export function ShortcutList({ shortcuts }: Pick<DashboardPayload, 'shortcuts'>) {
  return (
    <section className="card" aria-labelledby="shortcuts-heading">
      <h2 id="shortcuts-heading" className="text-xl font-semibold mb-4">
        Shortcuts
      </h2>
      <ul className="space-y-3">
        {shortcuts.map((shortcut) => (
          <li key={shortcut.id}>
            <Link
              href={shortcut.url}
              className="flex items-center justify-between rounded-lg border border-slate-800 px-4 py-3 hover:border-brand"
            >
              <span className="font-medium">{shortcut.title}</span>
              <span aria-hidden>&rarr;</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
