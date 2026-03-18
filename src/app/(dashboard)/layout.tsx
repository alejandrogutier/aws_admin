export const dynamic = "force-dynamic";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { awsAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  let accounts: Pick<import("@/types/aws").AwsAccount, "id" | "name" | "region" | "status">[] = [];
  try {
    const rows = await db
      .select({
        id: awsAccounts.id,
        name: awsAccounts.name,
        region: awsAccounts.region,
        status: awsAccounts.status,
      })
      .from(awsAccounts)
      .where(eq(awsAccounts.status, "active"));
    accounts = rows as typeof accounts;
  } catch {
    // DB not available yet — continue with empty accounts
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header accounts={accounts} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
