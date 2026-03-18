import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
