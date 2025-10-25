import React, { useCallback, useEffect, useMemo, useState } from 'react';
import HomeBadge, { Platform } from '../components/HomeBadge';

type AgentEntry = {
  name: string;
  role: string;
  homes: Platform[];
};

type RegistrySnapshot = {
  agents: AgentEntry[];
  roles: string[];
};

const ALL_PLATFORMS: Platform[] = ['github', 'huggingface', 'slack', 'notion', 'linear', 'dropbox'];

const fetchRegistry = async (): Promise<RegistrySnapshot> => {
  const response = await fetch('/api/registry/agents');
  if (!response.ok) {
    throw new Error('Failed to load registry snapshot');
  }
  const payload = await response.json();
  const agents = (payload.agents as { name: string; role: string; homes: string[] }[]).map(agent => ({
    name: agent.name,
    role: agent.role,
    homes: (agent.homes ?? []).map(home => home as Platform),
  }));
  return { roles: payload.roles as string[], agents };
};

const updateRegistry = async (agent: AgentEntry) => {
  const response = await fetch(`/api/registry/agents/${encodeURIComponent(agent.name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agent),
  });
  if (!response.ok) {
    throw new Error('Unable to persist agent configuration');
  }
};

const SettingsPage: React.FC = () => {
  const [agents, setAgents] = useState<AgentEntry[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchRegistry()
      .then(snapshot => {
        setAgents(snapshot.agents);
        setRoles(snapshot.roles);
      })
      .catch(err => setError(err.message));
  }, []);

  const current = useMemo(() => agents.find(a => a.name === selectedAgent) ?? null, [agents, selectedAgent]);

  const setCurrent = useCallback(
    (updater: (agent: AgentEntry) => AgentEntry) => {
      if (!current) return;
      setAgents(prev => prev.map(a => (a.name === current.name ? updater(a) : a)));
    },
    [current],
  );

  const handleRoleChange = useCallback(
    (role: string) => {
      setCurrent(agent => ({ ...agent, role }));
    },
    [setCurrent],
  );

  const toggleHome = useCallback(
    (platform: Platform) => {
      setCurrent(agent => {
        const homes = new Set(agent.homes);
        if (homes.has(platform)) {
          homes.delete(platform);
        } else {
          homes.add(platform);
        }
        return { ...agent, homes: Array.from(homes).sort() };
      });
    },
    [setCurrent],
  );

  const persistCurrent = useCallback(async () => {
    if (!current) return;
    setStatus('Saving…');
    setError('');
    try {
      await updateRegistry(current);
      setStatus('Saved');
    } catch (err) {
      setError((err as Error).message);
      setStatus('');
    }
  }, [current]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-10 text-slate-200">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Agent Governance</h1>
          <p className="text-sm text-slate-400">
            Assign platform homes, adjust role privileges, and ensure every agent respects the access matrix.
          </p>
        </div>
        <span className="text-xs uppercase tracking-widest text-slate-500">/settings/roles</span>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <aside className="rounded-lg border border-slate-800 bg-slate-950/50">
          <h2 className="border-b border-slate-800 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Agents
          </h2>
          <ul className="max-h-[32rem] overflow-y-auto px-2 py-3">
            {agents.map(agent => (
              <li key={agent.name}>
                <button
                  type="button"
                  onClick={() => setSelectedAgent(agent.name)}
                  className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition-colors ${
                    selectedAgent === agent.name ? 'bg-emerald-500/20 text-emerald-200' : 'hover:bg-slate-800/80'
                  }`}
                >
                  <span>{agent.name}</span>
                  <span className="text-xs uppercase text-slate-500">{agent.role}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="lg:col-span-2">
          {current ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{current.name}</h2>
                    <p className="text-xs uppercase tracking-widest text-slate-500">Role &amp; Access</p>
                  </div>
                  <button
                    type="button"
                    onClick={persistCurrent}
                    className="rounded bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
                  >
                    Save
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold uppercase text-slate-400">Role</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {roles.map(role => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleRoleChange(role)}
                          className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide transition-colors ${
                            current.role === role
                              ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                              : 'border-slate-700 bg-transparent text-slate-400 hover:border-emerald-500/40 hover:text-emerald-200'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase text-slate-400">Homes</h3>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {ALL_PLATFORMS.map(platform => (
                        <button key={platform} type="button" onClick={() => toggleHome(platform)}>
                          <HomeBadge platform={platform} active={current.homes.includes(platform)} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-400">
                <p>
                  Governance changes are written to <code className="text-emerald-300">registry/agent_roles.json</code> and audited via
                  <code className="text-emerald-300"> logs/auth_activity.log</code>. Platform credentials are checked automatically before
                  any deployment or message is dispatched.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-950/20 p-12 text-sm text-slate-500">
              Select an agent to begin.
            </div>
          )}
        </div>
      </section>

      <footer className="flex items-center justify-between text-xs uppercase tracking-widest">
        <span className="text-emerald-400">{status}</span>
        <span className="text-rose-400">{error}</span>
      </footer>
    </div>
  );
};

export default SettingsPage;
