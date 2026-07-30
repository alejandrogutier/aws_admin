import type { NextConfig } from "next";

/**
 * Inlines a build-time env var only when it actually has a value.
 *
 * Inlining an empty string would freeze the variable as "" in the bundle and
 * shadow any value the runtime does provide, so absent vars are left as genuine
 * runtime lookups instead.
 */
function inline(...names: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of names) {
    const value = process.env[name];
    if (value) out[name] = value;
  }
  return out;
}

const nextConfig: NextConfig = {
  output: "standalone",
  // Amplify env vars are not visible to the SSR Lambda at runtime, so the
  // values the server needs are inlined at build time. They only appear in
  // server bundles (all consumers are "server-only" or middleware).
  env: inline(
    "ADMIN_AWS_REGION",
    "ADMIN_AWS_ACCESS_KEY_ID",
    "ADMIN_AWS_SECRET_ACCESS_KEY",
    "ADMIN_AWS_USERNAME",
    // Non-secret Cognito identifiers. The auth guard fails closed without
    // these, so they must reach the SSR runtime too (INC1758541). The client
    // secret is deliberately absent — see amplify.yml.
    "COGNITO_USER_POOL_ID",
    "COGNITO_CLIENT_ID",
    "COGNITO_DOMAIN",
    "COGNITO_REGION",
    "APP_URL"
  ),
  serverExternalPackages: [
    "@aws-sdk/client-sts",
    "@aws-sdk/client-cost-explorer",
    "@aws-sdk/client-iam",
    "@aws-sdk/client-ec2",
    "@aws-sdk/client-lambda",
    "@aws-sdk/client-rds",
    "@aws-sdk/client-s3",
    "@aws-sdk/client-ecs",
    "@aws-sdk/client-cloudwatch",
    "@aws-sdk/client-resource-groups-tagging-api",
    "@aws-sdk/credential-providers",
    "pg",
  ],
};

export default nextConfig;
