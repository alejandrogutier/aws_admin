import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    // Only show which vars exist (not values) for security
    envCheck: {
      AWS_REGION: !!process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
      AWS_USERNAME: !!process.env.AWS_USERNAME,
      ADMIN_AWS_REGION: !!process.env.ADMIN_AWS_REGION,
      ADMIN_AWS_ACCESS_KEY_ID: !!process.env.ADMIN_AWS_ACCESS_KEY_ID,
      ADMIN_AWS_SECRET_ACCESS_KEY: !!process.env.ADMIN_AWS_SECRET_ACCESS_KEY,
      ADMIN_AWS_USERNAME: !!process.env.ADMIN_AWS_USERNAME,
    },
    resolved: {
      region: process.env.AWS_REGION || process.env.ADMIN_AWS_REGION || "NOT_SET",
      hasAccessKey: !!(process.env.AWS_ACCESS_KEY_ID || process.env.ADMIN_AWS_ACCESS_KEY_ID),
      hasSecretKey: !!(process.env.AWS_SECRET_ACCESS_KEY || process.env.ADMIN_AWS_SECRET_ACCESS_KEY),
      username: process.env.AWS_USERNAME || process.env.ADMIN_AWS_USERNAME || "NOT_SET",
    },
  });
}
