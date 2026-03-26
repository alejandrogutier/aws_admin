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
 * Returns all active accounts. Always includes the env-var primary account
 * first (if configured), plus any additional accounts from the database.
 */
export async function getActiveAccounts(): Promise<AccountInfo[]> {
  const accounts: AccountInfo[] = [];

  // Siempre incluir la cuenta primaria del .env si está configurada
  const { AWS_CONFIG } = await import("@/lib/aws-config.generated");
  if (AWS_CONFIG.accessKeyId && AWS_CONFIG.secretAccessKey) {
    accounts.push({
      id: ENV_ACCOUNT_ID,
      name: AWS_CONFIG.username || "Cuenta Principal",
      region: AWS_CONFIG.region,
      status: "active" as const,
      isPrimary: true,
    });
  }

  // Agregar cuentas adicionales de la DB (cross-account)
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

    // Excluir cuentas primarias sin roleArn (duplicarían la del env)
    for (const row of rows) {
      if (row.isPrimary) continue;
      accounts.push(row as AccountInfo);
    }
  } catch {
    // DB not available — solo mostramos la cuenta del env
  }

  return accounts;
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
