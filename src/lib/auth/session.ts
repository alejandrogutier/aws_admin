import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jose from "jose";

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const AWS_REGION = process.env.AWS_REGION || "us-east-1";

type UserSession = {
  sub: string;
  email: string;
  name?: string;
};

let jwksCache: jose.JWTVerifyGetKey | null = null;

function getJWKS() {
  if (!jwksCache && COGNITO_USER_POOL_ID) {
    const issuer = `https://cognito-idp.${AWS_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;
    jwksCache = jose.createRemoteJWKSet(
      new URL(`${issuer}/.well-known/jwks.json`)
    );
  }
  return jwksCache;
}

export async function getSession(): Promise<UserSession | null> {
  // If Cognito is not configured, allow access (development mode)
  if (!COGNITO_USER_POOL_ID) {
    return {
      sub: "dev-user",
      email: process.env.AWS_USERNAME || "dev@localhost",
      name: "Developer",
    };
  }

  const cookieStore = await cookies();
  const idToken = cookieStore.get("id_token")?.value;

  if (!idToken) return null;

  try {
    const jwks = getJWKS();
    if (!jwks) return null;

    const issuer = `https://cognito-idp.${AWS_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;
    const { payload } = await jose.jwtVerify(idToken, jwks, {
      issuer,
      audience: process.env.COGNITO_CLIENT_ID,
    });

    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: (payload.name as string) || (payload.email as string),
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
