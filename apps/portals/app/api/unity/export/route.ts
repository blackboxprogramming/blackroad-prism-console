import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { resolveUnityExporterUrl } from '../../../../lib/unity/exporter';

const payloadSchema = z.object({
  projectName: z.string().trim().min(1, 'projectName is required.'),
  template: z.string().trim().min(1).optional(),
  targets: z.array(z.string().trim().min(1)).min(1, 'Provide at least one build target.'),
  notes: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : undefined))
    .optional(),
});

export async function POST(request: NextRequest) {
  let parsed;
  try {
    parsed = payloadSchema.safeParse(await request.json());
  } catch (error) {
    console.error('Unity exporter proxy rejected request body', error);
    return NextResponse.json(
      { ok: false, error: 'Invalid request payload.' },
      { status: 400 },
    );
  }

  if (!parsed.success) {
    const [issue] = parsed.error.issues;
    return NextResponse.json(
      { ok: false, error: issue?.message || 'Invalid request payload.' },
      { status: 400 },
    );
  }

  const { projectName, template, targets, notes } = parsed.data;

  const exporterBase = resolveUnityExporterUrl(process.env.UNITY_EXPORTER_URL);

  let exporterUrl: URL;
  try {
    exporterUrl = new URL(exporterBase);
  } catch {
    console.error('Invalid UNITY_EXPORTER_URL provided', exporterBase);
    return NextResponse.json(
      { ok: false, error: 'UNITY_EXPORTER_URL is not a valid URL.' },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(new URL('/export', exporterUrl).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectName,
        template: template ?? undefined,
        targets,
        notes: notes ?? undefined,
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || (payload && payload.ok === false)) {
      const message = (payload && (payload.error as string | undefined)) || `Exporter returned ${response.status}`;
      return NextResponse.json(
        { ok: false, error: message },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      path: payload && (payload.path as string | undefined),
      exporter: payload,
    });
  } catch (error) {
    console.error('Unity exporter proxy failed', error);
    return NextResponse.json(
      { ok: false, error: 'Unable to reach the Unity exporter service.' },
      { status: 502 },
    );
  }
}
