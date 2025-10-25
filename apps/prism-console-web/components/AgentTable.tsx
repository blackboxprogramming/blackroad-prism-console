import { DashboardPayload } from '@/features/dashboard-api';

type Agent = {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'degraded';
  lastSeen: string;
};

const agentData: Agent[] = [
  { id: 'ops-1', name: 'Ops Autopilot', status: 'online', lastSeen: '2m ago' },
  { id: 'ops-2', name: 'Incident Router', status: 'degraded', lastSeen: '5m ago' },
  { id: 'ops-3', name: 'Policy Engine', status: 'offline', lastSeen: '12m ago' }
];

const statusClass = {
  online: 'text-emerald-400',
  offline: 'text-rose-400',
  degraded: 'text-amber-400'
};

export function AgentTable({ shortcuts }: Pick<DashboardPayload, 'shortcuts'>) {
  return (
    <section className="card" aria-labelledby="agents-heading">
      <div className="flex items-center justify-between mb-4">
        <h2 id="agents-heading" className="text-xl font-semibold">
          Agents
        </h2>
        <span className="text-sm text-slate-400">{shortcuts.length} quick actions</span>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-slate-400 uppercase tracking-wide">
          <tr>
            <th className="pb-2">Agent</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">Last Seen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {agentData.map((agent) => (
            <tr key={agent.id} className="hover:bg-slate-900/40">
              <td className="py-3 font-medium">{agent.name}</td>
              <td className={statusClass[agent.status]}> {agent.status}</td>
              <td className="text-slate-400">{agent.lastSeen}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
