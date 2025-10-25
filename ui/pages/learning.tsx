import React, { useEffect, useMemo, useState } from "react";

type LearningProposal = {
  id: string;
  status: string;
  agent: string;
  change_type: string;
  title: string;
  description?: string | null;
  diff?: string | null;
  diff_uri?: string | null;
  learning_modes: string[];
  signals: Record<string, number>;
  tags: string[];
  submitted_at: string;
  updated_at: string;
  approvals: Array<{ reviewer: string; decision: string; notes?: string | null; ts: string }>;
  audit_ref: string;
};

type XpScoreboard = Record<
  string,
  {
    craft: number;
    empathy: number;
    reliability: number;
    velocity: number;
    stewardship: number;
    level: number;
  }
>;

type LearningStatus = {
  proposals: LearningProposal[];
  xp: XpScoreboard;
  open_proposals: number;
  last_updated: string;
  recent_events: Array<Record<string, unknown>>;
};

const XP_PERKS: Record<number, string> = {
  2: "Can propose prompt patches",
  3: "Can schedule nightly experiments",
  4: "Can request finetune_light (approval needed)",
};

const statusEndpoint = "/learning/status";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch (error) {
    return iso;
  }
}

function useLearningStatus(): LearningStatus | null {
  const [status, setStatus] = useState<LearningStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function fetchStatus() {
      try {
        const response = await fetch(statusEndpoint, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load learning status: ${response.status}`);
        }
        const payload: LearningStatus = await response.json();
        if (mounted) {
          setStatus(payload);
        }
      } catch (error) {
        if (mounted) {
          console.error("Learning status fetch failed", error);
        }
      }
    }

    fetchStatus();
    const interval = window.setInterval(fetchStatus, 30_000);

    return () => {
      mounted = false;
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  return status;
}

function XpBadge({ agent, scores }: { agent: string; scores: XpScoreboard[string] }) {
  const perk = XP_PERKS[scores.level];
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{agent}</div>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
          Level {scores.level}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-slate-500">Craft</dt>
          <dd className="font-medium">{scores.craft.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Empathy</dt>
          <dd className="font-medium">{scores.empathy.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Reliability</dt>
          <dd className="font-medium">{scores.reliability.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Velocity</dt>
          <dd className="font-medium">{scores.velocity.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Stewardship</dt>
          <dd className="font-medium">{scores.stewardship.toFixed(1)}</dd>
        </div>
      </dl>
      {perk ? <p className="mt-3 text-xs text-slate-600">Perk: {perk}</p> : null}
    </div>
  );
}

function LearningInbox({ proposals }: { proposals: LearningProposal[] }) {
  if (proposals.length === 0) {
    return <p className="text-sm text-slate-500">No proposals yet. Agents are standing by.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Agent
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Change
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Signals
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Updated
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {proposals.map((proposal) => (
            <tr key={proposal.id}>
              <td className="px-4 py-3 text-sm font-medium text-slate-700">{proposal.agent}</td>
              <td className="px-4 py-3 text-sm text-slate-600">
                <div className="font-medium text-slate-800">{proposal.title}</div>
                <div className="text-xs text-slate-500">{proposal.change_type}</div>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {proposal.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {Object.entries(proposal.signals).map(([name, value]) => (
                  <div key={name}>
                    <span className="font-medium text-slate-700">{name}</span>: {value.toFixed(2)}
                  </div>
                ))}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{formatDate(proposal.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExperimentDashboard({ events }: { events: Array<Record<string, unknown>> }) {
  const recent = useMemo(() => events.slice(0, 6), [events]);
  if (recent.length === 0) {
    return <p className="text-sm text-slate-500">No experiments have been recorded yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {recent.map((event, index) => (
        <li key={`${event.event}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
          <div className="font-semibold text-slate-700">{String(event.event ?? "event")}</div>
          <div className="mt-1 text-xs text-slate-500">{JSON.stringify(event)}</div>
        </li>
      ))}
    </ul>
  );
}

function MemoryViewer({ proposals }: { proposals: LearningProposal[] }) {
  const memoryPins = proposals.flatMap((proposal) => proposal.learning_modes.map((mode) => `${proposal.agent}:${mode}`));
  if (memoryPins.length === 0) {
    return <p className="text-sm text-slate-500">Memories will appear here after nightly reflection.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {memoryPins.map((pin) => (
        <div key={pin} className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">
          {pin}
        </div>
      ))}
    </div>
  );
}

export default function LearningPage(): JSX.Element {
  const status = useLearningStatus();

  if (!status) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-800">Learning Inbox</h1>
        <p className="mt-2 text-sm text-slate-500">Loading learning telemetry…</p>
      </main>
    );
  }

  const xpEntries = Object.entries(status.xp);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Learning Inbox</h1>
          <p className="text-sm text-slate-500">Structured, auditable adaptations for the BlackRoad pantheon.</p>
        </div>
        <div className="text-xs text-slate-500">Last updated {formatDate(status.last_updated)}</div>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">Open Proposals</h2>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {status.open_proposals} open
          </span>
        </div>
        <LearningInbox proposals={status.proposals} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-800">XP Board</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {xpEntries.map(([agent, scores]) => (
            <XpBadge key={agent} agent={agent} scores={scores} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-800">Experiment Dashboard</h2>
        <ExperimentDashboard events={status.recent_events} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-800">Memory Viewer</h2>
        <MemoryViewer proposals={status.proposals} />
      </section>
    </main>
  );
}
