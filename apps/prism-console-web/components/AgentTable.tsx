import type { AgentRecord } from "@/types/dashboard";
import clsx from "clsx";

interface AgentTableProps {
  agents: AgentRecord[];
  isLoading?: boolean;
}

const statusStyles: Record<AgentRecord["status"], string> = {
  online: "bg-emerald-500/20 text-emerald-300",
  offline: "bg-rose-500/20 text-rose-300",
  degraded: "bg-amber-500/20 text-amber-200"
};

export function AgentTable({ agents, isLoading }: AgentTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
      <table className="min-w-full divide-y divide-slate-800">
        <thead className="bg-slate-900/80">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Agent
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Domain
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Memory
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Last Heartbeat
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {isLoading ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                Loading agents...
              </td>
            </tr>
          ) : (
            agents.map((agent) => (
              <tr key={agent.id} className="hover:bg-slate-800/40">
                <td className="px-6 py-4 text-sm font-medium text-white">{agent.name}</td>
                <td className="px-6 py-4 text-sm text-slate-300">{agent.domain}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", statusStyles[agent.status])}>
                    {agent.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-300">{agent.memoryUsageMb} MB</td>
                <td className="px-6 py-4 text-sm text-slate-400">{new Date(agent.lastHeartbeat).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
