import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
