import { DashboardPayload } from '@/features/dashboard-api';
import clsx from 'clsx';

const statusStyles: Record<DashboardPayload['metrics'][number]['status'], string> = {
  healthy: 'bg-emerald-950 border-emerald-700 text-emerald-200',
  warning: 'bg-amber-950 border-amber-700 text-amber-100',
  critical: 'bg-rose-950 border-rose-700 text-rose-100'
};

export function MetricsGrid({ metrics }: Pick<DashboardPayload, 'metrics'>) {
  return (
    <section className="card" aria-labelledby="metrics-heading">
      <h2 id="metrics-heading" className="text-xl font-semibold mb-4">
        Metrics Grid
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <article
            key={metric.id}
            className={clsx(
              'rounded-lg border p-4 transition hover:-translate-y-0.5',
              statusStyles[metric.status]
            )}
            aria-label={`${metric.title} ${metric.value}`}
          >
            <div className="text-sm uppercase tracking-wide text-slate-400">{metric.title}</div>
            <div className="text-3xl font-semibold">{metric.value}</div>
            <div className="text-sm text-slate-300 mt-2">{metric.caption}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
