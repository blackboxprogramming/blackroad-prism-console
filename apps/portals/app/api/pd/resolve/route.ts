import { NextRequest, NextResponse } from 'next/server';
import { addPagerDutyNote, resolvePagerDutyIncident } from '../../../../lib/pagerduty';
import { jiraBrowseUrl, jiraResolve } from '../../../../lib/jira';
import { getAuditByPagerDutyId, insertIncidentAudit } from '../../../../lib/incident-audit';

interface ResolvePagerDutyRequest {
  incidentId: string;
  resolution?: string;
  postmortemUrl?: string;
  actorEmail?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { incidentId, resolution, postmortemUrl, actorEmail } =
      (await req.json()) as ResolvePagerDutyRequest;

    if (!incidentId) {
      return NextResponse.json({ error: 'incidentId is required' }, { status: 400 });
    }

    const resolutionText = resolution?.trim() || 'Resolved via Ops Portal';
    const pagerDutyIncident = await resolvePagerDutyIncident(incidentId, resolutionText);

    const auditRow = await getAuditByPagerDutyId(incidentId);
    if (auditRow?.jira_key) {
      const comment = postmortemUrl
        ? `Post-mortem: ${postmortemUrl}`
        : 'Resolved via Ops Portal';
      await jiraResolve(auditRow.jira_key, 'Fixed', comment);
    }

    if (postmortemUrl) {
      try {
        await addPagerDutyNote(incidentId, `Post-mortem: ${postmortemUrl}`);
      } catch (noteError) {
        console.error('Failed to add PagerDuty post-mortem note', noteError);
      }
    }

    await insertIncidentAudit({
      actorEmail,
      systemKey: auditRow?.system_key ?? undefined,
      action: 'resolve',
      pdIncidentId: incidentId,
      pdUrl: pagerDutyIncident.html_url,
      jiraKey: auditRow?.jira_key ?? undefined,
      resolvedAt: new Date(),
    });

    return NextResponse.json({
      ok: true,
      incidentId,
      pagerDuty: {
        id: pagerDutyIncident.id,
        url: pagerDutyIncident.html_url,
      },
      jira: auditRow?.jira_key
        ? {
            key: auditRow.jira_key,
            url: jiraBrowseUrl(auditRow.jira_key),
          }
        : null,
    });
  } catch (error) {
    console.error('PagerDuty resolve failed', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
