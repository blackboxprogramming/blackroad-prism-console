import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "@/lib/ops/auth";
import { resolvePagerDutyIncident } from "@/lib/ops/pagerduty";
import { postSlackMessage } from "@/lib/ops/slack";

export async function POST(req: NextRequest) {
  try {
    const { email } = requireOpsAccess(req);
    const { incidentId, postmortemUrl } = await req.json();
    if (!incidentId || typeof incidentId !== "string") {
      return NextResponse.json({ error: "invalid_incident" }, { status: 400 });
    }

    await resolvePagerDutyIncident({ incidentId, actorEmail: email, postmortemUrl });

    await postSlackMessage(`✅ PD incident resolved: ${incidentId}\n${postmortemUrl || ""}`);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const message = String(err?.message || err);
    if (message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
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
