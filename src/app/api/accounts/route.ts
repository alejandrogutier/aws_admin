import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { awsAccounts } from "@/lib/db/schema";
import { accountSchema } from "@/lib/validations";
import { validateConnection } from "@/lib/aws/credentials";
import { requireApiSession, checkRateLimit } from "@/lib/auth/api";

/**
 * Columns safe to return to an authenticated admin.
 *
 * `externalId` is deliberately excluded: it is the shared secret in the
 * cross-account AssumeRole trust policy and must never leave the server.
 */
const publicColumns = {
  id: awsAccounts.id,
  name: awsAccounts.name,
  roleArn: awsAccounts.roleArn,
  region: awsAccounts.region,
  isPrimary: awsAccounts.isPrimary,
  status: awsAccounts.status,
  lastConnectedAt: awsAccounts.lastConnectedAt,
  createdAt: awsAccounts.createdAt,
  updatedAt: awsAccounts.updatedAt,
};

export async function GET() {
  const { session, response } = await requireApiSession();
  if (!session) return response;

  const limited = checkRateLimit(`accounts:get:${session.sub}`);
  if (limited) return limited;

  try {
    const accounts = await db.select(publicColumns).from(awsAccounts);
    return NextResponse.json({ data: accounts });
  } catch (err) {
    console.error("GET /api/accounts failed", err);
    return NextResponse.json(
      { error: "Failed to fetch accounts", code: 500 },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireApiSession();
  if (!session) return response;

  const limited = checkRateLimit(`accounts:post:${session.sub}`);
  if (limited) return limited;

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
        // The raw STS error names the calling principal and account id, so it
        // is logged server-side and never returned to the client.
        console.error(
          `AssumeRole validation failed for ${roleArn}: ${validation.error}`
        );
        return NextResponse.json(
          {
            error:
              "No se pudo validar la conexión con el rol indicado. Revisa el ARN, el External ID y la política de confianza.",
            code: 400,
          },
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
      .returning(publicColumns);

    return NextResponse.json({ data: account }, { status: 201 });
  } catch (err) {
    console.error("POST /api/accounts failed", err);
    return NextResponse.json(
      { error: "Failed to create account", code: 500 },
      { status: 500 }
    );
  }
}
