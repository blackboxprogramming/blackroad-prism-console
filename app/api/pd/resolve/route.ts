import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "@/lib/ops/auth";
import { getIncidentByPagerDutyId, getOpenIncidentForSystem } from "@/lib/ops/db";
import { resolvePagerDutyIncident, shouldUseSandbox } from "@/lib/ops/pagerduty";
import { postSlackMessage } from "@/lib/ops/slack";
import { jiraBrowseUrl, jiraResolve } from "@/lib/ops/jira";

export async function POST(req: NextRequest) {
  try {
    const { email } = requireOpsAccess(req);
    const { incidentId, postmortemUrl, systemKey: providedSystemKey } = await req.json();
    const sandboxParam = req.nextUrl.searchParams.get("sandbox");
    const sandboxFlag = shouldUseSandbox(
      providedSystemKey || "",
      sandboxParam ? ["1", "true", "yes", "y", "sandbox"].includes(sandboxParam.toLowerCase()) : undefined,
    );

    const smokeSystemKey = process.env.SMOKE_SYSTEM_KEY || "sandbox";
    let targetIncidentId = incidentId;

    if (sandboxFlag && incidentId === "infer") {
      const openSandbox = getOpenIncidentForSystem(smokeSystemKey);
      if (!openSandbox?.pdIncidentId) {
        return NextResponse.json({ error: "sandbox_incident_missing" }, { status: 404 });
      }
      targetIncidentId = openSandbox.pdIncidentId;
    }

    if (!targetIncidentId || typeof targetIncidentId !== "string") {
      return NextResponse.json({ error: "invalid_incident" }, { status: 400 });
    }

    await resolvePagerDutyIncident({ incidentId: targetIncidentId, actorEmail: email, postmortemUrl, sandbox: sandboxFlag });

    const record = getIncidentByPagerDutyId(targetIncidentId);
    if (record?.jiraKey) {
      const comment = postmortemUrl ? `Resolved via Ops Portal — ${postmortemUrl}` : "Resolved via Ops Portal";
      await jiraResolve(record.jiraKey, "Done", comment, sandboxFlag);
    }

    if (!sandboxFlag) {
      const slackLink = record?.jiraKey ? `\nJira: ${jiraBrowseUrl(record.jiraKey)}` : "";
      await postSlackMessage(`✅ PD incident resolved: ${targetIncidentId}\n${postmortemUrl || ""}${slackLink}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const message = String(err?.message || err);
    if (message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (message === "sandbox_incident_missing") {
      return NextResponse.json({ error: "sandbox_incident_missing" }, { status: 404 });
    }
    if (message.startsWith("pd_error")) {
      return NextResponse.json({ error: "pd_error", details: message }, { status: 502 });
    }
    if (message === "pd_env_missing") {
      return NextResponse.json({ error: "pd_env_missing" }, { status: 500 });
    }
    return NextResponse.json({ error: "server_error", details: message }, { status: 500 });
  }
}
