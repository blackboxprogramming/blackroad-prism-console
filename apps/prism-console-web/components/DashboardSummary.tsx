import { DashboardPayload } from '@/features/dashboard-api';

export function DashboardSummary({ summary }: Pick<DashboardPayload, 'summary'>) {
  return (
    <section className="card" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="text-xl font-semibold mb-3">
        Operations Pulse
      </h2>
      <p className="text-slate-300 leading-relaxed">{summary}</p>
    </section>
  );
}
