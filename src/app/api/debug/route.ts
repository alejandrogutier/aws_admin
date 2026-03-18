import { NextResponse } from "next/server";
import { AWS_CONFIG } from "@/lib/aws-config.generated";

export async function GET() {
  return NextResponse.json({
    configCheck: {
      hasRegion: !!AWS_CONFIG.region,
      hasAccessKey: !!AWS_CONFIG.accessKeyId,
      hasSecretKey: !!AWS_CONFIG.secretAccessKey,
      hasUsername: !!AWS_CONFIG.username,
      region: AWS_CONFIG.region,
      // Show first 4 chars of access key for verification (safe)
      accessKeyPrefix: AWS_CONFIG.accessKeyId ? AWS_CONFIG.accessKeyId.substring(0, 4) + "..." : "NOT_SET",
    },
  });
}
