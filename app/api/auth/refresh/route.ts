import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.AI_CONSOLE_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:8000';

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch (error) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      return NextResponse.json(data ?? { error: 'refresh_failed' }, { status: upstream.status });
    }

    return NextResponse.json(data, {
      status: upstream.status,
      headers: { 'cache-control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'refresh_unreachable' }, { status: 502 });
  }
}
