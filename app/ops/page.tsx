import Heatmap from "./components/Heatmap";
import { getRiskSnapshot } from "@/lib/ops/risk";
import { getRecentIncidentEvents } from "@/lib/ops/db";

export const dynamic = "force-dynamic";

export default async function OpsPage() {
  const snapshot = getRiskSnapshot();
  const audit = getRecentIncidentEvents(10);

  return (
    <main style={{ padding: "2rem", fontFamily: "Inter, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 600 }}>Ops Heatmap</h1>
      </header>
      <Heatmap initialSystems={snapshot.systems} initialAudit={audit} generatedAt={snapshot.generatedAt} />
    </main>
  );
}
