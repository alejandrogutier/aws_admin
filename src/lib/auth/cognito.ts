import "server-only";

import { RUNTIME_SECRETS } from "@/lib/aws-config.generated";

const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN || "";
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || "";
// Not inlined via next.config.ts — baked into the server-only module instead.
const COGNITO_CLIENT_SECRET =
  process.env.COGNITO_CLIENT_SECRET || RUNTIME_SECRETS.cognitoClientSecret;
const APP_URL = process.env.APP_URL || "http://localhost:3000";

const REDIRECT_URI = `${APP_URL}/api/auth/callback`;

/** Returns null when Cognito is not configured, so callers can say so plainly. */
export function getLoginUrl(): string | null {
  if (!COGNITO_DOMAIN || !COGNITO_CLIENT_ID) return null;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: COGNITO_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "openid email profile",
  });
  return `https://${COGNITO_DOMAIN}/login?${params.toString()}`;
}

export function getLogoutUrl(): string | null {
  if (!COGNITO_DOMAIN || !COGNITO_CLIENT_ID) return null;

  const params = new URLSearchParams({
    client_id: COGNITO_CLIENT_ID,
    logout_uri: APP_URL,
  });
  return `https://${COGNITO_DOMAIN}/logout?${params.toString()}`;
}

type TokenResponse = {
  id_token: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
};

export async function exchangeCodeForTokens(
  code: string
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: COGNITO_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code,
  });

  const credentials = Buffer.from(
    `${COGNITO_CLIENT_ID}:${COGNITO_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(`https://${COGNITO_DOMAIN}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

export async function refreshTokens(
  refreshToken: string
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: COGNITO_CLIENT_ID,
    refresh_token: refreshToken,
  });

  const credentials = Buffer.from(
    `${COGNITO_CLIENT_ID}:${COGNITO_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(`https://${COGNITO_DOMAIN}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error("Token refresh failed");
  }

  return response.json();
}
