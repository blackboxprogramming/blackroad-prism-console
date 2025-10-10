import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "@/lib/ops/auth";

function parseSandboxFlag(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return ["1", "true", "yes", "y", "sandbox"].includes(normalized);
}

function buildBaseUrl(req: NextRequest): string {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(/:$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.host;
  return `${proto}://${host}`.replace(/\/$/, "");
}

export async function POST(req: NextRequest) {
  try {
    const { email, groups } = requireOpsAccess(req);
    if (!parseSandboxFlag(req.nextUrl.searchParams.get("sandbox"))) {
      return NextResponse.json({ ok: false, error: "sandbox_only" }, { status: 400 });
    }
    const systemKey = process.env.SMOKE_SYSTEM_KEY || "sandbox";
    const baseUrl = buildBaseUrl(req);
    const headers = {
      "Content-Type": "application/json",
      "x-user-email": email,
      "x-user-groups": groups.join(","),
    };

    const createRes = await fetch(`${baseUrl}/api/pd/create?sandbox=1`, {
      method: "POST",
      headers,
      body: JSON.stringify({ systemKey, overrideUrgency: "low" }),
    });
    const createData = await createRes.json();
    if (!createRes.ok || !createData.ok) {
      const error = createData?.error || `pd_create_${createRes.status}`;
      return NextResponse.json({ ok: false, error }, { status: createRes.status });
    }

    const riskRes = await fetch(`${baseUrl}/api/scorecard/risk?sandbox=1`);
    const riskData = await riskRes.json();
    let jiraKey = "";
    if (riskRes.ok && Array.isArray(riskData.systems)) {
      const sandboxSystem = riskData.systems.find((s: any) => s.key === systemKey);
      jiraKey = sandboxSystem?.jiraKey || sandboxSystem?.jira_key || "";
    }

    const resolveRes = await fetch(`${baseUrl}/api/pd/resolve?sandbox=1`, {
      method: "POST",
      headers,
      body: JSON.stringify({ incidentId: "infer", systemKey }),
    });
    const resolveData = await resolveRes.json();
    if (!resolveRes.ok || !resolveData.ok) {
      return NextResponse.json(
        { ok: false, error: resolveData?.error || `pd_resolve_${resolveRes.status}` },
        { status: resolveRes.status },
      );
    }

    const jiraUrl = createData?.jira?.url
      || (jiraKey
        ? `${process.env.JIRA_BASE_SANDBOX || process.env.JIRA_BASE || baseUrl}/browse/${jiraKey}`
        : "");

    return NextResponse.json({
      ok: true,
      pd: createData.url,
      jira: jiraUrl,
    });
  } catch (err: any) {
    const message = String(err?.message || err);
    if (message === "forbidden") {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
