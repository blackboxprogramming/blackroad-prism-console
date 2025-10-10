const PAGERDUTY_API_BASE = 'https://api.pagerduty.com';

export interface CreatePagerDutyIncidentParams {
  title: string;
  serviceId: string;
  urgency?: 'high' | 'low';
  body: string;
  escalationPolicyId?: string;
  runbookUrls?: string[];
}

export interface PagerDutyIncident {
  id: string;
  html_url: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function baseHeaders() {
  return {
    Authorization: `Token token=${requireEnv('PD_API_TOKEN')}`,
    Accept: 'application/vnd.pagerduty+json;version=2',
    'Content-Type': 'application/json',
    From: requireEnv('PD_FROM_EMAIL'),
  } as Record<string, string>;
}

export async function createPagerDutyIncident(
  params: CreatePagerDutyIncidentParams,
): Promise<PagerDutyIncident> {
  const { title, serviceId, urgency = 'high', body, escalationPolicyId, runbookUrls = [] } = params;

  const incidentBody = [body.trim(), ...runbookUrls.map(url => `Runbook: ${url}`)]
    .filter(Boolean)
    .join('\n\n');

  const payload = {
    incident: {
      type: 'incident',
      title,
      service: {
        id: serviceId,
        type: 'service_reference',
      },
      urgency,
      body: {
        type: 'incident_body',
        details: incidentBody,
      },
    } as Record<string, unknown>,
  };

  if (escalationPolicyId) {
    payload.incident.escalation_policy = {
      id: escalationPolicyId,
      type: 'escalation_policy_reference',
    };
  }

  const response = await fetch(`${PAGERDUTY_API_BASE}/incidents`, {
    method: 'POST',
    headers: baseHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to create PagerDuty incident: ${message}`);
  }

  const json = (await response.json()) as { incident: PagerDutyIncident };
  return json.incident;
}

export async function resolvePagerDutyIncident(
  incidentId: string,
  resolution: string,
): Promise<PagerDutyIncident> {
  const response = await fetch(`${PAGERDUTY_API_BASE}/incidents/${incidentId}`, {
    method: 'PUT',
    headers: baseHeaders(),
    body: JSON.stringify({
      incident: {
        type: 'incident_reference',
        status: 'resolved',
        resolution,
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to resolve PagerDuty incident: ${message}`);
  }

  const json = (await response.json()) as { incident: PagerDutyIncident };
  return json.incident;
}

export async function addPagerDutyNote(incidentId: string, content: string): Promise<void> {
  const response = await fetch(`${PAGERDUTY_API_BASE}/incidents/${incidentId}/notes`, {
    method: 'POST',
    headers: baseHeaders(),
    body: JSON.stringify({
      note: { content },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to add PagerDuty note: ${message}`);
  }
}
