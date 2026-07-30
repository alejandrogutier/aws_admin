import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  isAuthConfigured,
  isDevBypassEnabled,
  devSession,
  verifyIdToken,
  type UserSession,
} from "@/lib/auth/verify";

export type { UserSession };

/**
 * Resolves the caller's session from the `id_token` cookie.
 *
 * Fails closed: when Cognito is not configured this returns null instead of a
 * synthetic administrator. A missing COGNITO_USER_POOL_ID at runtime used to
 * grant every anonymous visitor full access to the dashboard (INC1758541).
 */
export async function getSession(): Promise<UserSession | null> {
  if (!isAuthConfigured()) {
    return isDevBypassEnabled() ? devSession() : null;
  }

  const cookieStore = await cookies();
  return verifyIdToken(cookieStore.get("id_token")?.value);
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
