import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.AI_CONSOLE_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:8000';

export async function GET(req: NextRequest) {
  const headers: Record<string, string> = { 'accept': 'application/json' };
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    headers['authorization'] = authHeader;
  }

  try {
    const upstream = await fetch(`${API_BASE_URL}/system/status`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      return NextResponse.json(data ?? { error: 'status_unavailable' }, { status: upstream.status });
    }

    return NextResponse.json(data, {
      status: upstream.status,
      headers: { 'cache-control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'status_unreachable' }, { status: 502 });
  }
}
