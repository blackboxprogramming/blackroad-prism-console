import { NextResponse } from "next/server";
import { loadRiskScorecard } from "../service";

export const dynamic = "force-dynamic";

function formatLine(name: string, color: string, risk: number, action: string) {
  const colorUpper = color.toUpperCase();
  return `• ${name} — ${colorUpper} (risk ${risk.toFixed(2)}): ${action}`;
}

export async function POST() {
  const webhook = process.env.SLACK_WEBHOOK;
  if (!webhook) {
    return NextResponse.json({ ok: false, error: "SLACK_WEBHOOK not configured" }, { status: 500 });
  }

  const payload = await loadRiskScorecard();
  const top3 = payload.systems.slice(0, 3).map((system) => formatLine(system.name, system.color, system.risk, system.action));
  const body = {
    text: `Risk Heatmap – Top 3\n${top3.join("\n")}`,
  };

  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return NextResponse.json({ ok: false, error: `Slack webhook failed (${response.status})` }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
