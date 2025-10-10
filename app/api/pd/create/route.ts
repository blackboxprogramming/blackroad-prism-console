import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "@/lib/ops/auth";
import { getLastCreateForSystem, getOpenIncidentForSystem, attachJiraKey, getKv, setKv } from "@/lib/ops/db";
import { createPagerDutyIncident, shouldUseSandbox } from "@/lib/ops/pagerduty";
import { getRunbookUrl } from "@/lib/ops/config";
import { jiraBrowseUrl, jiraCreateIssue } from "@/lib/ops/jira";

const FIVE_MINUTES = 5 * 60 * 1000;
const SANDBOX_THROTTLE_MS = 60 * 60 * 1000;

function parseSandboxFlag(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return ["1", "true", "yes", "y", "sandbox"].includes(normalized);
}

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

    const sandbox = shouldUseSandbox(systemKey, parseSandboxFlag(req.nextUrl.searchParams.get("sandbox")));

    if (sandbox) {
      const throttleKey = `smoke:last-run:${systemKey}`;
      const record = getKv(throttleKey);
      if (record?.updatedAt) {
        const lastTs = Date.parse(record.updatedAt);
        if (!Number.isNaN(lastTs) && Date.now() - lastTs < SANDBOX_THROTTLE_MS) {
          const retryAt = new Date(lastTs + SANDBOX_THROTTLE_MS).toISOString();
          return NextResponse.json(
            { error: "sandbox_throttled", retryAt },
            { status: 429 },
          );
        }
      }
    }

    const existing = getOpenIncidentForSystem(systemKey);
    if (existing?.pdIncidentId && existing.url) {
      return NextResponse.json({
        ok: true,
        dedup: true,
        url: existing.url,
        incidentId: existing.pdIncidentId,
        openedAt: existing.createdAt,
        jiraKey: existing.jiraKey ?? undefined,
        jiraUrl: existing.jiraKey ? jiraBrowseUrl(existing.jiraKey, sandbox) : undefined,
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
        runbook: getRunbookUrl(systemKey, { sandbox }) || undefined,
        sandbox,
      },
      sandbox,
    });

    const runbookUrl = getRunbookUrl(systemKey, { sandbox });
    const jiraSummary = title || `Ops incident for ${systemKey}`;
    const descriptionParts = [
      (details || "Triggered via Ops Portal").trim(),
      `PD: ${result.url}`,
    ];
    if (runbookUrl) {
      descriptionParts.push(`Runbook: ${runbookUrl}`);
    }
    const labels = Array.from(
      new Set([
        "incident",
        systemKey,
        sandbox ? "sandbox" : null,
        sandbox ? "smoke" : null,
      ].filter(Boolean) as string[]),
    );

    const issue = await jiraCreateIssue({
      summary: jiraSummary,
      description: descriptionParts.join("\n\n"),
      labels,
      sandbox,
    });

    if (result.auditRecordId) {
      attachJiraKey(result.auditRecordId, issue.key);
    }

    if (sandbox) {
      setKv(`smoke:last-run:${systemKey}`, new Date().toISOString());
    }

    return NextResponse.json({
      ok: true,
      incidentId: result.incidentId,
      url: result.url,
      jira: {
        key: issue.key,
        url: jiraBrowseUrl(issue.key, sandbox),
      },
    });
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
    if (message.startsWith("sandbox_throttled")) {
      return NextResponse.json({ error: "sandbox_throttled" }, { status: 429 });
    }
    if (message.startsWith("pd_error")) {
      return NextResponse.json({ error: "pd_error", details: message }, { status: 502 });
    }
    return NextResponse.json({ error: "server_error", details: message }, { status: 500 });
  }
}
