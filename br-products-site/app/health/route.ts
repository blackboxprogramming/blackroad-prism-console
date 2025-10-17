import { NextResponse } from 'next/server';
export function GET() {
  return NextResponse.json({ ok: true, service: 'br-products-site', ts: Date.now() });
}
