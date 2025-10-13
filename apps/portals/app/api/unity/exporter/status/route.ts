import { NextResponse } from 'next/server';

import { resolveUnityExporterUrl } from '../../../../../lib/unity/exporter';

type ProbeMethod = 'HEAD' | 'GET';

async function probeExporter(base: URL) {
  const probes: Array<{ method: ProbeMethod; path: string }> = [
    { method: 'HEAD', path: '/' },
    { method: 'GET', path: '/health' },
    { method: 'GET', path: '/' },
  ];

  let lastError: unknown = null;

  for (const probe of probes) {
    try {
      const response = await fetch(new URL(probe.path, base).toString(), {
        method: probe.method,
        cache: 'no-store',
        redirect: 'manual',
        headers:
          probe.method === 'GET'
            ? {
                Accept: 'application/json, text/plain, */*',
              }
            : undefined,
      });

      if (response.ok) {
        return { response, method: probe.method, path: probe.path };
      }

      if (probe.method === 'HEAD' && response.status === 405) {
        continue;
      }

      if (probe.method === 'GET' && probe.path === '/health' && response.status === 404) {
        continue;
      }

      return { response, method: probe.method, path: probe.path };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('Unity exporter probe failed.');
}

export async function GET() {
  const exporterBase = resolveUnityExporterUrl(process.env.UNITY_EXPORTER_URL);

  let exporterUrl: URL;
  try {
    exporterUrl = new URL(exporterBase);
  } catch {
    console.error('Invalid UNITY_EXPORTER_URL provided', exporterBase);
    return NextResponse.json(
      { ok: false, reachable: false, error: 'UNITY_EXPORTER_URL is not a valid URL.' },
      { status: 500 },
    );
  }

  try {
    const { response, method, path } = await probeExporter(exporterUrl);
    const message = response.ok
      ? `Exporter responded with HTTP ${response.status} via ${method} ${path}.`
      : `Exporter responded with HTTP ${response.status}.`;

    return NextResponse.json(
      {
        ok: response.ok,
        reachable: true,
        status: response.status,
        method,
        path,
        message,
      },
      { status: response.ok ? 200 : 502 },
    );
  } catch (error) {
    console.error('Unity exporter status check failed', error);
    return NextResponse.json(
      { ok: false, reachable: false, error: 'Unable to reach the Unity exporter service.' },
      { status: 502 },
    );
  }
}
