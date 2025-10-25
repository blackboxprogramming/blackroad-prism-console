import React, { useEffect, useState } from 'react';
import HomeBadge, { Platform } from '../components/HomeBadge';

type AgentSummary = {
  name: string;
  homes: Platform[];
  role: string;
  lastActivity?: string;
};

const fetchAgentSummaries = async (): Promise<AgentSummary[]> => {
  const response = await fetch('/api/registry/agents');
  if (!response.ok) {
    throw new Error('Unable to load agents');
  }
  const payload = await response.json();
  const rawAgents = payload.agents as {
    name: string;
    homes: string[];
    role: string;
    lastActivity?: string;
  }[];
  return rawAgents.map(agent => ({
    name: agent.name,
    role: agent.role,
    homes: (agent.homes ?? []).map(home => home as Platform),
    lastActivity: agent.lastActivity,
  }));
};

const DashboardPage: React.FC = () => {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchAgentSummaries()
      .then(setAgents)
      .catch(err => setError(err.message));
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-10 text-slate-100">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Operational Dashboard</h1>
          <p className="text-sm text-slate-500">Visibility into every deployed agent and its active platform homes.</p>
        </div>
        <span className="text-xs uppercase tracking-widest text-slate-500">/dashboard</span>
      </header>

      {error && <p className="rounded border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p>}

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {agents.map(agent => (
          <article
            key={agent.name}
            className="rounded-xl border border-slate-800 bg-slate-950/40 p-6 shadow-lg shadow-black/20"
          >
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{agent.name}</h2>
                <p className="text-xs uppercase tracking-widest text-slate-500">{agent.role}</p>
              </div>
              <span className="text-[10px] text-slate-500">{agent.lastActivity ?? 'No activity logged'}</span>
            </header>
            <div className="mt-4 flex flex-wrap gap-2">
              {agent.homes.map(home => (
                <HomeBadge key={home} platform={home} />
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default DashboardPage;
