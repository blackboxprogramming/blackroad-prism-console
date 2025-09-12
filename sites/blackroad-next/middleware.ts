import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set('Strict-Transport-Security','max-age=63072000; includeSubDomains; preload');
  res.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  res.headers.set('X-Content-Type-Options','nosniff');
  res.headers.set('Permissions-Policy','geolocation=(), microphone=(), camera=()');
  res.headers.set('Content-Security-Policy',"default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' https: 'unsafe-inline' 'report-sample'; connect-src 'self'; font-src 'self' https: data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  return res;
}
