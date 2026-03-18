import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { awsAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { accountSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const account = await db.query.awsAccounts.findFirst({
      where: eq(awsAccounts.id, id),
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found", code: 404 },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: account });
  } catch {
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
  const { id } = await params;

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
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Account not found", code: 404 },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch {
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
  const { id } = await params;

  try {
    const [deleted] = await db
      .delete(awsAccounts)
      .where(eq(awsAccounts.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Account not found", code: 404 },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete account", code: 500 },
      { status: 500 }
    );
  }
}
