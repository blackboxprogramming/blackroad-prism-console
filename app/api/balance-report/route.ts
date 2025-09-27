import { NextResponse } from "next/server";

export const runtime = "edge";

interface PillarMetric {
  pillar: "speed" | "safety" | "creativity" | "care";
  score: number;
  trend: "up" | "steady" | "down";
  note: string;
}

const PILLAR_METRICS: PillarMetric[] = [
  {
    pillar: "speed",
    score: 0.78,
    trend: "steady",
    note: "Deployment cadence holding at weekly releases after last stability pause."
  },
  {
    pillar: "safety",
    score: 0.86,
    trend: "up",
    note: "Incident review closed two action items; access review automation now live."
  },
  {
    pillar: "creativity",
    score: 0.74,
    trend: "down",
    note: "Experiment backlog trimmed to focus on two high-signal prototypes."
  },
  {
    pillar: "care",
    score: 0.82,
    trend: "steady",
    note: "Customer council sessions increased to bi-weekly; trust score unchanged."
  }
];

export async function GET() {
  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    summary: "Balance posture under review weekly; creativity dip flagged for follow-up.",
    pillars: PILLAR_METRICS,
    tradeOffs: [
      {
        decision: "Prioritized security backlog ahead of experimental UI work",
        support: ["safety", "care"],
        flexed: ["creativity"],
        note: "Governance #20 approved temporary shift; revisit after next guardrail audit."
      }
    ]
  });
}
