import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { awsAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { accountSchema } from "@/lib/validations";
import { requireApiSession, checkRateLimit } from "@/lib/auth/api";

/** Same allowlist as the collection route — `externalId` never leaves the server. */
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

const idSchema = z.string().uuid();

const notFound = NextResponse.json(
  { error: "Account not found", code: 404 },
  { status: 404 }
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireApiSession();
  if (!session) return response;

  const limited = checkRateLimit(`accounts:id:get:${session.sub}`);
  if (limited) return limited;

  const { id } = await params;
  if (!idSchema.safeParse(id).success) return notFound;

  try {
    const [account] = await db
      .select(publicColumns)
      .from(awsAccounts)
      .where(eq(awsAccounts.id, id));

    if (!account) return notFound;

    return NextResponse.json({ data: account });
  } catch (err) {
    console.error(`GET /api/accounts/${id} failed`, err);
    return NextResponse.json(
      { error: "Failed to fetch account", code: 500 },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireApiSession();
  if (!session) return response;

  const limited = checkRateLimit(`accounts:id:put:${session.sub}`);
  if (limited) return limited;

  const { id } = await params;
  if (!idSchema.safeParse(id).success) return notFound;

  try {
    const body = await request.json();
    const parsed = accountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message, code: 400 },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(awsAccounts)
      .set({
        ...parsed.data,
        roleArn: parsed.data.roleArn || null,
        externalId: parsed.data.externalId || null,
        updatedAt: new Date(),
      })
      .where(eq(awsAccounts.id, id))
      .returning(publicColumns);

    if (!updated) return notFound;

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error(`PUT /api/accounts/${id} failed`, err);
    return NextResponse.json(
      { error: "Failed to update account", code: 500 },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireApiSession();
  if (!session) return response;

  const limited = checkRateLimit(`accounts:id:delete:${session.sub}`);
  if (limited) return limited;

  const { id } = await params;
  if (!idSchema.safeParse(id).success) return notFound;

  try {
    const [deleted] = await db
      .delete(awsAccounts)
      .where(eq(awsAccounts.id, id))
      .returning({ id: awsAccounts.id });

    if (!deleted) return notFound;

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    console.error(`DELETE /api/accounts/${id} failed`, err);
    return NextResponse.json(
      { error: "Failed to delete account", code: 500 },
      { status: 500 }
    );
  }
}
