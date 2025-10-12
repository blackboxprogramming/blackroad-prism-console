import { NextResponse } from 'next/server';

const DEFAULT_EXPORTER_URL = 'http://127.0.0.1:3001';

function normalizeUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { ok: false, error: 'Invalid request payload.' },
      { status: 400 },
    );
  }

  const { projectName, template, targets, notes } = body as {
    projectName?: unknown;
    template?: unknown;
    targets?: unknown;
    notes?: unknown;
  };

  if (!projectName || typeof projectName !== 'string' || projectName.trim().length === 0) {
    return NextResponse.json(
      { ok: false, error: 'projectName is required.' },
      { status: 400 },
    );
  }

  if (!Array.isArray(targets) || targets.length === 0 || targets.some((t) => typeof t !== 'string')) {
    return NextResponse.json(
      { ok: false, error: 'Provide at least one build target.' },
      { status: 400 },
    );
  }

  const exporterUrl = normalizeUrl(
    process.env.UNITY_EXPORTER_URL && process.env.UNITY_EXPORTER_URL.trim().length > 0
      ? process.env.UNITY_EXPORTER_URL
      : DEFAULT_EXPORTER_URL,
  );

  try {
    const response = await fetch(`${exporterUrl}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectName: projectName.trim(),
        template,
        targets,
        notes,
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
