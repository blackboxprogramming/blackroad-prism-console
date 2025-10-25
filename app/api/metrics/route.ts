import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.AI_CONSOLE_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:8000';

export async function GET(req: NextRequest) {
  const headers = new Headers();
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    headers.set('authorization', authHeader);
  }

  try {
    const upstream = await fetch(`${API_BASE_URL}/metrics`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const body = await upstream.text();
      return new NextResponse(body, {
        status: upstream.status,
        headers: { 'content-type': upstream.headers.get('content-type') || 'text/plain' },
      });
    }

    const responseHeaders = new Headers(upstream.headers);
    const body = upstream.body;
    if (!responseHeaders.has('content-type')) {
      responseHeaders.set('content-type', 'text/plain; version=0.0.4');
    }
    return new NextResponse(body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json({ error: 'metrics_unreachable' }, { status: 502 });
  }
}
