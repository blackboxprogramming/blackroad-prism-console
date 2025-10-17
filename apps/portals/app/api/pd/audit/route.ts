import { NextResponse } from 'next/server';
import { IncidentAuditRecord, listRecentAudit } from '../../../../lib/incident-audit';

export async function GET() {
  try {
    const records = await listRecentAudit();
    return NextResponse.json({ ok: true, records });
  } catch (error) {
    console.error('Failed to list incident audit', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export type { IncidentAuditRecord };
