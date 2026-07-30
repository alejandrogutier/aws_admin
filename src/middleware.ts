import { NextRequest, NextResponse } from "next/server";
import { isAuthConfigured, isDevBypassEnabled, verifyIdToken } from "@/lib/auth/verify";

/**
 * Deny-by-default edge guard. Everything that is not explicitly public requires
 * a valid Cognito ID token: pages redirect to /login, API routes get a 401.
 */

const PUBLIC_PREFIXES = ["/login", "/api/auth"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  if (!isAuthConfigured() && isDevBypassEnabled()) {
    return NextResponse.next();
  }

  const session = await verifyIdToken(request.cookies.get("id_token")?.value);
  if (session) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Unauthorized", code: 401 },
      { status: 401 }
    );
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Everything except Next.js internals and static asset files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?)$).*)",
  ],
};
