import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "@/lib/ops/auth";
import { getLastCreateForSystem, getOpenIncidentForSystem } from "@/lib/ops/db";
import { createPagerDutyIncident } from "@/lib/ops/pagerduty";
import { getRunbookUrl } from "@/lib/ops/config";

const FIVE_MINUTES = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { email } = requireOpsAccess(req);
    const body = await req.json();
    const { systemKey, title, details, overrideUrgency, metadata } = body || {};

    if (!systemKey || typeof systemKey !== "string") {
      return NextResponse.json({ error: "invalid_system" }, { status: 400 });
    }

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "invalid_title" }, { status: 400 });
    }

    const existing = getOpenIncidentForSystem(systemKey);
    if (existing?.pdIncidentId && existing.url) {
      return NextResponse.json({
        ok: true,
        dedup: true,
        url: existing.url,
        incidentId: existing.pdIncidentId,
        openedAt: existing.createdAt,
      });
    }

    const lastCreate = getLastCreateForSystem(systemKey);
    if (lastCreate?.createdAt) {
      const lastTs = Date.parse(lastCreate.createdAt);
      if (!Number.isNaN(lastTs) && Date.now() - lastTs < FIVE_MINUTES) {
        const retryAt = new Date(lastTs + FIVE_MINUTES).toISOString();
        return NextResponse.json(
          { error: "already_opened_recently", retryAt },
          { status: 409 }
        );
      }
    }

    const result = await createPagerDutyIncident({
      systemKey,
      title,
      details,
      overrideUrgency,
      actorEmail: email,
      metadata: {
        ...((metadata && typeof metadata === "object") ? metadata : {}),
        source: "ops_portal",
        runbook: getRunbookUrl(systemKey) || undefined,
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
    if (message.startsWith("pd_config_missing")) {
      return NextResponse.json({ error: "pd_config_missing" }, { status: 400 });
    }
    if (message.startsWith("pd_error")) {
      return NextResponse.json({ error: "pd_error", details: message }, { status: 502 });
    }
    return NextResponse.json({ error: "server_error", details: message }, { status: 500 });
  }
}
