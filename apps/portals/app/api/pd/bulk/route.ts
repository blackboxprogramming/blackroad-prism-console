import { NextRequest, NextResponse } from 'next/server';
import { addPagerDutyNote } from '../../../../lib/pagerduty';
import { jiraBrowseUrl, jiraCreateIssue } from '../../../../lib/jira';
import { insertIncidentAudit } from '../../../../lib/incident-audit';

interface BulkSweepRequest {
  pdIncidentId: string;
  pdUrl: string;
  systems: string[];
  tasksMarkdown: string;
  actorEmail?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { pdIncidentId, pdUrl, systems, tasksMarkdown = '', actorEmail } =
      (await req.json()) as BulkSweepRequest;

    if (!pdIncidentId || !pdUrl || !Array.isArray(systems) || systems.length === 0) {
      return NextResponse.json(
        { error: 'pdIncidentId, pdUrl, and systems are required' },
        { status: 400 },
      );
    }

    const summary = `Risk sweep: ${systems.length} systems yellow`;
    const description = [
      `Systems:\n${systems.map(s => `- ${s}`).join('\n')}`,
      `Tasks:\n${tasksMarkdown}`,
      `PD: ${pdUrl}`,
      process.env.RUNBOOK_URL ? `Runbook: ${process.env.RUNBOOK_URL}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    const issue = await jiraCreateIssue({
      summary,
      description,
      labels: ['risk-sweep', 'pagerduty'],
    });

    await insertIncidentAudit({
      actorEmail,
      action: 'bulk',
      pdIncidentId,
      pdUrl,
      jiraKey: issue.key,
      payloadHash: null,
      openedAt: new Date(),
    });

    try {
      await addPagerDutyNote(pdIncidentId, `Jira: ${jiraBrowseUrl(issue.key)}`);
    } catch (noteError) {
      console.error('Failed to add sweep Jira note', noteError);
    }

    return NextResponse.json({
      ok: true,
      pagerDuty: {
        id: pdIncidentId,
        url: pdUrl,
      },
      jira: {
        key: issue.key,
        url: jiraBrowseUrl(issue.key),
      },
    });
  } catch (error) {
    console.error('PagerDuty bulk sweep failed', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
