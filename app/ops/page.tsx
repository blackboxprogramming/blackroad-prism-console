import OpsDashboard from "./components/OpsDashboard";
import Heatmap from "./components/Heatmap";
import SmokeStatusTile from "./components/SmokeStatusTile";
import { getRiskSnapshot } from "@/lib/ops/risk";
import { getRecentIncidentEvents } from "@/lib/ops/db";

export const dynamic = "force-dynamic";

export default async function OpsPage() {
  const snapshot = getRiskSnapshot({ includeSandbox: true });
  const audit = getRecentIncidentEvents(10);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-slate-900">Operations Console</h1>
          <p className="text-sm text-slate-600">
            Monitor deploy health, feature flags, and incidents in near real time.
          </p>
        </header>
        <div className="w-full">
          <SmokeStatusTile />
        </div>
        <OpsDashboard />
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Heatmap initialSystems={snapshot.systems} initialAudit={audit} generatedAt={snapshot.generatedAt} />
        </section>
      </div>
    </main>
  );
}
