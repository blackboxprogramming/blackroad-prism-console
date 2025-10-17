import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { addPagerDutyNote, createPagerDutyIncident } from '../../../../lib/pagerduty';
import { jiraBrowseUrl, jiraCreateIssue } from '../../../../lib/jira';
import {
  findRecentCreateForSystem,
  insertIncidentAudit,
} from '../../../../lib/incident-audit';

interface CreatePagerDutyRequest {
  title: string;
  bodyMd: string;
  systemKey: string;
  serviceId: string;
  urgency?: 'high' | 'low';
  escalationPolicyId?: string;
  actorEmail?: string;
  runbookUrls?: string[];
  labels?: string[];
}

function sanitizeSummary(title: string) {
  return title.replace(/^\[.*?\]\s*/, '').trim();
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as CreatePagerDutyRequest;
    const {
      title,
      bodyMd,
      systemKey,
      serviceId,
      urgency = 'high',
      escalationPolicyId,
      actorEmail,
      runbookUrls = [],
      labels = [],
    } = payload;

    if (!title || !bodyMd || !systemKey || !serviceId) {
      return NextResponse.json(
        { error: 'title, bodyMd, systemKey, and serviceId are required' },
        { status: 400 },
      );
    }

    const recent = await findRecentCreateForSystem(systemKey);
    if (recent) {
      return NextResponse.json(
        {
          error: 'Incident already opened for this system within the last five minutes',
        },
        { status: 429 },
      );
    }

    const pagerDutyIncident = await createPagerDutyIncident({
      title,
      body: bodyMd,
      serviceId,
      urgency,
      escalationPolicyId,
      runbookUrls,
    });

    const jiraSummary = sanitizeSummary(title);
    const jiraDescriptionParts = [bodyMd.trim(), `PD: ${pagerDutyIncident.html_url}`];
    if (runbookUrls.length > 0) {
      jiraDescriptionParts.push(`Runbooks:\n${runbookUrls.join('\n')}`);
    }
    const jiraDescription = jiraDescriptionParts.join('\n\n');

    const allLabels = Array.from(new Set(['incident', 'pagerduty', systemKey, ...labels]));

    const issue = await jiraCreateIssue({
      summary: jiraSummary,
      description: jiraDescription,
      labels: allLabels,
    });

    const payloadHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ title, bodyMd, systemKey, serviceId }))
      .digest('hex');

    await insertIncidentAudit({
      actorEmail,
      systemKey,
      action: 'create',
      pdIncidentId: pagerDutyIncident.id,
      pdUrl: pagerDutyIncident.html_url,
      jiraKey: issue.key,
      payloadHash,
      openedAt: new Date(),
    });

    try {
      await addPagerDutyNote(
        pagerDutyIncident.id,
        `Jira: ${jiraBrowseUrl(issue.key)}`,
      );
    } catch (noteError) {
      console.error('Failed to add PagerDuty note for Jira link', noteError);
    }

    return NextResponse.json({
      ok: true,
      pagerDuty: {
        id: pagerDutyIncident.id,
        url: pagerDutyIncident.html_url,
      },
      jira: {
        key: issue.key,
        url: jiraBrowseUrl(issue.key),
      },
      systemKey,
    });
  } catch (error) {
    console.error('PagerDuty create failed', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
