import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const USER = process.env.BASIC_AUTH_USER || "";
const PASS = process.env.BASIC_AUTH_PASS || "";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const proto = req.headers.get("x-forwarded-proto");
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const proto = request.headers.get("x-forwarded-proto");

  if (proto === "http") {
    url.protocol = "https";
    return NextResponse.redirect(url);
  }

  if (url.hostname === "www.blackroad.io") {
    url.hostname = "blackroad.io";
    return NextResponse.redirect(url);
  }

  if (req.nextUrl.pathname.startsWith("/codex/private")) {
    const header = req.headers.get("authorization") || "";
    const ok =
      header.startsWith("Basic ") &&
      (() => {
        try {
          const [u, p] = atob(header.replace("Basic ", "")).split(":");
          return u === USER && p === PASS;
        } catch {
          return false;
        }
      })();
    if (!ok) {
      return new NextResponse("Authorization Required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Blackroad Codex"' },
      });
    }
  }

  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "accelerometer=(), camera=(), microphone=()"
  );
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'"
  );
  return res;
  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
