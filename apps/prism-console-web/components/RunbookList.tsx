const runbooks = [
  { id: 'rb-1', title: 'Database Failover', summary: 'Steps to failover the primary cluster.' },
  { id: 'rb-2', title: 'API Latency Spike', summary: 'Triage and mitigation for latency alerts.' },
  { id: 'rb-3', title: 'Incident Commander Handoff', summary: 'Checklist when rotating on-call leadership.' }
];

export function RunbookList() {
  return (
    <section className="card" aria-labelledby="runbooks-heading">
      <h2 id="runbooks-heading" className="text-xl font-semibold mb-4">
        Runbooks
      </h2>
      <ul className="space-y-4">
        {runbooks.map((runbook) => (
          <li key={runbook.id} className="border border-slate-800 rounded-lg p-4 hover:border-brand">
            <h3 className="font-semibold text-lg">{runbook.title}</h3>
            <p className="text-sm text-slate-300 mt-2">{runbook.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
