import { NextResponse, type NextRequest } from 'next/server';

// Read once at boot; same value you set in CI for path previews
const BASE_PATH = process.env.BASE_PATH?.trim()?.replace(/\/+$/, '') || '';

function withSecurityHeaders(res: NextResponse) {
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' https: 'unsafe-inline' 'report-sample'; connect-src 'self'; font-src 'self' https: data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  );
  return res;
}

export function middleware(req: NextRequest) {
  if (!BASE_PATH) {
    return withSecurityHeaders(NextResponse.next());
  }

  const url = req.nextUrl.clone();
  const { pathname } = url;

  if (
    pathname === BASE_PATH ||
    pathname.startsWith(`${BASE_PATH}/`) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap')
  ) {
    return withSecurityHeaders(NextResponse.next());
  }

  if (pathname === '/health') {
    return withSecurityHeaders(NextResponse.next());
  }

  url.pathname = pathname === '/' ? `${BASE_PATH}/` : `${BASE_PATH}${pathname}`;
  return withSecurityHeaders(NextResponse.redirect(url, { status: 307 }));
}

export const config = {
  // Run on everything but static assets in /public; tweak if needed
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
