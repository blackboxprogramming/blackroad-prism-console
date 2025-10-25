import { AgentTable } from '@/components/AgentTable';
import { ShortcutList } from '@/components/ShortcutList';
import { fetchDashboard } from '@/features/dashboard-api';

export const revalidate = 0;

export default async function AgentsPage() {
  const payload = await fetchDashboard();

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]" aria-labelledby="agents-heading">
      <AgentTable shortcuts={payload.shortcuts} />
      <ShortcutList shortcuts={payload.shortcuts} />
"use client";

import { AgentTable } from "@/components/AgentTable";
import { useAgents } from "@/hooks/useAgents";

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Agents</h2>
        <p className="text-sm text-slate-400">Review the full roster of Prism agents and their operational posture.</p>
      </div>
      <AgentTable agents={agents ?? []} isLoading={isLoading} />
    </div>
  );
}
