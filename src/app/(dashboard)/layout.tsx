export const dynamic = "force-dynamic";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { requireAuth } from "@/lib/auth/session";
import { getActiveAccounts } from "@/lib/accounts";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  const accounts = await getActiveAccounts();

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
