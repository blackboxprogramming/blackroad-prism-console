import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "@/lib/ops/auth";
import { getRiskSnapshot } from "@/lib/ops/risk";
import { getBulkThreshold } from "@/lib/ops/config";
import { createPagerDutyIncident } from "@/lib/ops/pagerduty";
import { getLastCreateForSystem, getOpenIncidentForSystem } from "@/lib/ops/db";

const BULK_SYSTEM_KEY = "bulk";
const FIVE_MINUTES = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { email } = requireOpsAccess(req);
    const snapshot = getRiskSnapshot();
    const yellow = snapshot.systems.filter((s) => s.color === "yellow");
    const threshold = getBulkThreshold();

    if (yellow.length < threshold) {
      return NextResponse.json({ ok: false, reason: "threshold_not_met", count: yellow.length });
    }

    const open = getOpenIncidentForSystem(BULK_SYSTEM_KEY);
    if (open?.pdIncidentId && open.url) {
      return NextResponse.json({
        ok: true,
        dedup: true,
        incidentId: open.pdIncidentId,
        url: open.url,
      });
    }

    const last = getLastCreateForSystem(BULK_SYSTEM_KEY);
    if (last?.createdAt) {
      const lastTs = Date.parse(last.createdAt);
      if (!Number.isNaN(lastTs) && Date.now() - lastTs < FIVE_MINUTES) {
        return NextResponse.json(
          { error: "already_opened_recently", retryAt: new Date(lastTs + FIVE_MINUTES).toISOString() },
          { status: 409 }
        );
      }
    }

    const tasks = yellow
      .map((s) => `- ${s.name}: ${s.action} (risk ${s.risk.toFixed(2)})`)
      .join("\n");

    const details = `Multiple medium risks detected:\n${tasks}`;

    const result = await createPagerDutyIncident({
      systemKey: BULK_SYSTEM_KEY,
      title: `Risk sweep: ${yellow.length} yellow systems`,
      details,
      actorEmail: email,
      metadata: {
        bulk: true,
        systems: yellow.map((s) => s.key),
        threshold,
      },
    });

    return NextResponse.json({ ok: true, incidentId: result.incidentId, url: result.url });
  } catch (err: any) {
    const message = String(err?.message || err);
    if (message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (message === "pd_env_missing") {
      return NextResponse.json({ error: "pd_env_missing" }, { status: 500 });
    }
    if (message.startsWith("pd_error")) {
      return NextResponse.json({ error: "pd_error", details: message }, { status: 502 });
    }
    if (message.startsWith("pd_config_missing")) {
      return NextResponse.json({ error: "pd_config_missing" }, { status: 400 });
    }
    return NextResponse.json({ error: "server_error", details: message }, { status: 500 });
  }
}
