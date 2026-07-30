import * as jose from "jose";

/**
 * Token verification shared by middleware (edge runtime) and route handlers.
 * Deliberately free of `next/headers` and `server-only` so the same code path
 * guards every entrypoint.
 */

export type UserSession = {
  sub: string;
  email: string;
  name?: string;
};

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || "";
const CLIENT_ID = process.env.COGNITO_CLIENT_ID || "";
// Prefer the explicitly configured pool region: on Lambda, AWS_REGION is set to
// the function's own region, which is not necessarily the user pool's.
const REGION =
  process.env.COGNITO_REGION ||
  process.env.ADMIN_AWS_REGION ||
  process.env.AWS_REGION ||
  "us-east-1";

/**
 * Local-only escape hatch. Never honoured when NODE_ENV is "production", so a
 * missing variable in a deployed environment can never re-open the dashboard.
 */
export function isDevBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.AUTH_DEV_BYPASS === "true"
  );
}

export function isAuthConfigured(): boolean {
  return Boolean(USER_POOL_ID && CLIENT_ID);
}

const ISSUER = USER_POOL_ID
  ? `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`
  : "";

let jwksCache: jose.JWTVerifyGetKey | null = null;

function getJWKS(): jose.JWTVerifyGetKey | null {
  if (!ISSUER) return null;
  if (!jwksCache) {
    jwksCache = jose.createRemoteJWKSet(
      new URL(`${ISSUER}/.well-known/jwks.json`)
    );
  }
  return jwksCache;
}

/**
 * Verifies a Cognito ID token. Returns null on any failure — an unconfigured
 * pool, a missing token, a bad signature, a wrong audience or an expired token
 * are all treated identically: no session.
 */
export async function verifyIdToken(
  token: string | undefined
): Promise<UserSession | null> {
  if (!token) return null;
  if (!isAuthConfigured()) return null;

  const jwks = getJWKS();
  if (!jwks) return null;

  try {
    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: ISSUER,
      audience: CLIENT_ID,
    });

    const sub = payload.sub;
    const email = payload.email;
    if (typeof sub !== "string" || typeof email !== "string") return null;

    return {
      sub,
      email,
      name: typeof payload.name === "string" ? payload.name : email,
    };
  } catch {
    return null;
  }
}

export function devSession(): UserSession {
  return { sub: "dev-user", email: "dev@localhost", name: "Developer" };
}
