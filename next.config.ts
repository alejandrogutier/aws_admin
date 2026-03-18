import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Inline ADMIN_AWS_* vars at build time for Amplify SSR runtime.
  // These only appear in server bundles (all AWS code uses "server-only").
  env: {
    ADMIN_AWS_REGION: process.env.ADMIN_AWS_REGION || "",
    ADMIN_AWS_ACCESS_KEY_ID: process.env.ADMIN_AWS_ACCESS_KEY_ID || "",
    ADMIN_AWS_SECRET_ACCESS_KEY: process.env.ADMIN_AWS_SECRET_ACCESS_KEY || "",
    ADMIN_AWS_USERNAME: process.env.ADMIN_AWS_USERNAME || "",
  },
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
