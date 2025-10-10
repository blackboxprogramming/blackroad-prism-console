import { getRunbookUrl, getSystemPagerDutyConfig, type SystemPagerDutyConfig } from "./config";
import { hashPayload } from "./hash";
import { getSystemForIncidentId, logIncidentEvent } from "./db";

interface BaseIncidentInput {
  systemKey: string;
  title: string;
  details?: string;
  overrideUrgency?: "low" | "high";
  actorEmail: string;
  metadata?: Record<string, unknown>;
  sandbox?: boolean;
}

interface CreateIncidentResult {
  incidentId: string;
  url: string;
  payloadHash: string;
  auditRecordId: string;
}

function ensurePagerDutyEnv(sandbox: boolean): { token: string; from: string } {
  const token = sandbox
    ? process.env.PD_API_TOKEN_SANDBOX || process.env.PD_API_TOKEN
    : process.env.PD_API_TOKEN;
  const from = sandbox
    ? process.env.PD_FROM_EMAIL_SANDBOX || process.env.PD_FROM_EMAIL
    : process.env.PD_FROM_EMAIL;
  if (!token || !from) {
    throw new Error("pd_env_missing");
  }
  return { token, from };
}

export function shouldUseSandbox(systemKey: string, sandbox?: boolean): boolean {
  if (sandbox) return true;
  const normalized = (systemKey || "").toLowerCase();
  const desired = (process.env.SMOKE_SYSTEM_KEY || "sandbox").toLowerCase();
  return normalized === "sandbox" || normalized === desired;
}

function applySandboxOverrides(
  sandbox: boolean,
  cfg: SystemPagerDutyConfig | undefined,
): SystemPagerDutyConfig | undefined {
  if (!sandbox || !cfg) return cfg;
  const serviceId = process.env.PD_SERVICE_SANDBOX || cfg.serviceId;
  const escalationPolicyId = process.env.PD_ESCALATION_POLICY_SANDBOX || cfg.escalationPolicyId;
  const urgency = cfg.urgency ?? "low";
  return {
    ...cfg,
    serviceId,
    escalationPolicyId,
    assignees: [],
    urgency,
  };
}

export async function createPagerDutyIncident(input: BaseIncidentInput): Promise<CreateIncidentResult> {
  const { systemKey, title, details = "", overrideUrgency, actorEmail, metadata, sandbox: sandboxOpt } = input;
  const sandbox = shouldUseSandbox(systemKey, sandboxOpt);
  const cfg = getSystemPagerDutyConfig(systemKey);
  const effectiveCfg = applySandboxOverrides(sandbox, cfg);
  if (!effectiveCfg) {
    throw new Error(`pd_config_missing:${systemKey}`);
  }

  const runbook = getRunbookUrl(systemKey, { sandbox });
  const baseDetails = [details.trim(), runbook ? `Runbook: ${runbook}` : null]
    .filter(Boolean)
    .join("\n\n");

  const incident: Record<string, any> = {
    type: "incident",
    title,
    service: { id: effectiveCfg.serviceId, type: "service_reference" },
    body: {
      type: "incident_body",
      details: baseDetails || "Triggered via Ops Portal",
    },
  };

  if (effectiveCfg.escalationPolicyId) {
    incident.escalation_policy = {
      id: effectiveCfg.escalationPolicyId,
      type: "escalation_policy_reference",
    };
  }

  if (effectiveCfg.assignees?.length) {
    incident.assignments = effectiveCfg.assignees.map((id) => ({
      assignee: { id, type: "user_reference" },
    }));
  }

  const urgency = overrideUrgency || effectiveCfg.urgency;
  if (urgency) {
    incident.urgency = urgency;
  }

  const payload = { incident };
  const payloadHash = hashPayload(payload);
  const { token, from } = ensurePagerDutyEnv(sandbox);

  const res = await fetch("https://api.pagerduty.com/incidents", {
    method: "POST",
    headers: {
      Authorization: `Token token=${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.pagerduty+json;version=2",
      From: from,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`pd_error:${res.status}:${text}`);
  }

  const data = await res.json();
  const incidentId = data?.incident?.id;
  const url = data?.incident?.html_url;
  if (!incidentId || !url) {
    throw new Error("pd_response_unexpected");
  }

  const record = logIncidentEvent({
    actorEmail,
    action: metadata?.bulk ? "bulk" : "create",
    systemKey,
    pdIncidentId: incidentId,
    url,
    payloadHash,
    details: metadata && Object.keys(metadata).length ? JSON.stringify(metadata) : null,
  });

  return { incidentId, url, payloadHash, auditRecordId: record.id };
}

export async function resolvePagerDutyIncident(params: {
  incidentId: string;
  actorEmail: string;
  postmortemUrl?: string;
  sandbox?: boolean;
}): Promise<void> {
  const { incidentId, actorEmail, postmortemUrl, sandbox: sandboxOpt } = params;
  const sandbox = sandboxOpt ? true : shouldUseSandbox(getSystemForIncidentId(incidentId) ?? "", false);
  const { token, from } = ensurePagerDutyEnv(sandbox);
  
  const body = {
    incident: {
      type: "incident",
      status: "resolved",
      resolution: postmortemUrl
        ? `See post-mortem: ${postmortemUrl}`
        : "Resolved via Ops Portal",
    },
  };

  const res = await fetch(`https://api.pagerduty.com/incidents/${incidentId}`, {
    method: "PUT",
    headers: {
      Authorization: `Token token=${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.pagerduty+json;version=2",
      From: from,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`pd_error:${res.status}:${text}`);
  }

  const systemKey = getSystemForIncidentId(incidentId);

  logIncidentEvent({
    actorEmail,
    action: "resolve",
    systemKey,
    pdIncidentId: incidentId,
    details: postmortemUrl ? JSON.stringify({ postmortemUrl }) : null,
  });
}
