import "server-only";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import type { UserSession } from "@/lib/auth/verify";

/**
 * Route-handler guard. The edge middleware already blocks unauthenticated
 * traffic; this repeats the check inside the handler so a matcher change or a
 * direct invocation can never silently expose an endpoint.
 *
 * Returns either the session or the NextResponse to return to the caller.
 */
export async function requireApiSession(): Promise<
  { session: UserSession; response: null } | { session: null; response: NextResponse }
> {
  const session = await getSession();

  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Unauthorized", code: 401 },
        { status: 401 }
      ),
    };
  }

  return { session, response: null };
}

/**
 * Small fixed-window limiter keyed by caller identity.
 *
 * This is per-instance state: on Amplify's SSR Lambda it bounds abuse per warm
 * container, not globally. It is a speed bump against enumeration, not a
 * substitute for a WAF rate-based rule or API Gateway usage plan.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string): NextResponse | null {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests", code: 429 },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  return null;
}
