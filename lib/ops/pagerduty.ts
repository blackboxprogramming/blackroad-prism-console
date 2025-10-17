import { getRunbookUrl, getSystemPagerDutyConfig } from "./config";
import { hashPayload } from "./hash";
import { getSystemForIncidentId, logIncidentEvent } from "./db";

interface BaseIncidentInput {
  systemKey: string;
  title: string;
  details?: string;
  overrideUrgency?: "low" | "high";
  actorEmail: string;
  metadata?: Record<string, unknown>;
}

interface CreateIncidentResult {
  incidentId: string;
  url: string;
  payloadHash: string;
}

function ensurePagerDutyEnv(): { token: string; from: string } {
  const token = process.env.PD_API_TOKEN;
  const from = process.env.PD_FROM_EMAIL;
  if (!token || !from) {
    throw new Error("pd_env_missing");
  }
  return { token, from };
}

export async function createPagerDutyIncident(input: BaseIncidentInput): Promise<CreateIncidentResult> {
  const { systemKey, title, details = "", overrideUrgency, actorEmail, metadata } = input;
  const cfg = getSystemPagerDutyConfig(systemKey);
  if (!cfg) {
    throw new Error(`pd_config_missing:${systemKey}`);
  }

  const runbook = getRunbookUrl(systemKey);
  const baseDetails = [details.trim(), runbook ? `Runbook: ${runbook}` : null]
    .filter(Boolean)
    .join("\n\n");

  const incident: Record<string, any> = {
    type: "incident",
    title,
    service: { id: cfg.serviceId, type: "service_reference" },
    body: {
      type: "incident_body",
      details: baseDetails || "Triggered via Ops Portal",
    },
  };

  if (cfg.escalationPolicyId) {
    incident.escalation_policy = {
      id: cfg.escalationPolicyId,
      type: "escalation_policy_reference",
    };
  }

  if (cfg.assignees?.length) {
    incident.assignments = cfg.assignees.map((id) => ({
      assignee: { id, type: "user_reference" },
    }));
  }

  const urgency = overrideUrgency || cfg.urgency;
  if (urgency) {
    incident.urgency = urgency;
  }

  const payload = { incident };
  const payloadHash = hashPayload(payload);
  const { token, from } = ensurePagerDutyEnv();

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

  logIncidentEvent({
    actorEmail,
    action: metadata?.bulk ? "bulk" : "create",
    systemKey,
    pdIncidentId: incidentId,
    url,
    payloadHash,
    details: metadata && Object.keys(metadata).length ? JSON.stringify(metadata) : null,
  });

  return { incidentId, url, payloadHash };
}

export async function resolvePagerDutyIncident(params: {
  incidentId: string;
  actorEmail: string;
  postmortemUrl?: string;
}): Promise<void> {
  const { token, from } = ensurePagerDutyEnv();
  const { incidentId, actorEmail, postmortemUrl } = params;

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
