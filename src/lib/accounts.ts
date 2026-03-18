import "server-only";

import type { AccountStatus } from "@/types/aws";

type AccountInfo = {
  id: string;
  name: string;
  region: string;
  status: AccountStatus;
  isPrimary: boolean;
};

const ENV_ACCOUNT_ID = "env-primary";

/**
 * Returns all active accounts. Falls back to env-var primary account
 * if the database is not available or has no accounts configured.
 */
export async function getActiveAccounts(): Promise<AccountInfo[]> {
  try {
    const { db } = await import("@/lib/db");
    const { awsAccounts } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const rows = await db
      .select({
        id: awsAccounts.id,
        name: awsAccounts.name,
        region: awsAccounts.region,
        status: awsAccounts.status,
        isPrimary: awsAccounts.isPrimary,
      })
      .from(awsAccounts)
      .where(eq(awsAccounts.status, "active"));

    if (rows.length > 0) return rows as AccountInfo[];
  } catch {
    // DB not available — fall through to env fallback
  }

  // Fallback: use env/generated config as virtual primary account
  const { AWS_CONFIG } = await import("@/lib/aws-config.generated");

  if (AWS_CONFIG.accessKeyId && AWS_CONFIG.secretAccessKey) {
    return [
      {
        id: ENV_ACCOUNT_ID,
        name: AWS_CONFIG.username || "Cuenta Principal",
        region: AWS_CONFIG.region,
        status: "active" as const,
        isPrimary: true,
      },
    ];
  }

  return [];
}

/**
 * Returns accounts filtered by optional accountId param.
 * If accountId is provided, returns only that account.
 * Otherwise returns all active accounts.
 */
export async function getFilteredAccounts(
  accountId: string | undefined
): Promise<Pick<AccountInfo, "id" | "name">[]> {
  const all = await getActiveAccounts();

  if (accountId) {
    const match = all.find((a) => a.id === accountId);
    return match ? [{ id: match.id, name: match.name }] : [];
  }

  return all.map((a) => ({ id: a.id, name: a.name }));
}

export function isEnvAccount(accountId: string): boolean {
  return accountId === ENV_ACCOUNT_ID;
}

export { ENV_ACCOUNT_ID };
