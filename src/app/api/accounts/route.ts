import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { awsAccounts } from "@/lib/db/schema";
import { accountSchema } from "@/lib/validations";
import { validateConnection } from "@/lib/aws/credentials";

export async function GET() {
  try {
    const accounts = await db.select().from(awsAccounts);
    return NextResponse.json({ data: accounts });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch accounts", code: 500 },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = accountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message, code: 400 },
        { status: 400 }
      );
    }

    const { name, roleArn, externalId, region } = parsed.data;
    const isPrimary = !roleArn;

    // Test connection before saving
    if (roleArn) {
      const validation = await validateConnection(
        undefined,
        roleArn,
        externalId,
        region
      );
      if (!validation.success) {
        return NextResponse.json(
          { error: `Connection failed: ${validation.error}`, code: 400 },
          { status: 400 }
        );
      }
    }

    const [account] = await db
      .insert(awsAccounts)
      .values({
        name,
        roleArn: roleArn || null,
        externalId: externalId || null,
        region,
        isPrimary,
        status: "active",
        lastConnectedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ data: account }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create account", code: 500 },
      { status: 500 }
    );
  }
}
