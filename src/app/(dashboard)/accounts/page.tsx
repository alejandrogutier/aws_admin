import { db } from "@/lib/db";
import { awsAccounts } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddAccountDialog } from "@/components/accounts/add-account-dialog";
import { Building2, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { INSTANCE_STATE_COLORS } from "@/lib/constants";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  error: "bg-red-500/15 text-red-500 border-red-500/20",
  pending: "bg-amber-500/15 text-amber-500 border-amber-500/20",
};

export default async function AccountsPage() {
  let accounts: (typeof awsAccounts.$inferSelect)[] = [];

  try {
    accounts = await db.select().from(awsAccounts);
  } catch {
    // DB not available
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Cuentas AWS
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las cuentas AWS conectadas
          </p>
        </div>
        <AddAccountDialog />
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">
              No hay cuentas configuradas
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Agrega tu primera cuenta AWS para comenzar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Link key={account.id} href={`/accounts/${account.id}`}>
              <Card className="transition-colors hover:border-primary/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {account.name}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={statusStyles[account.status] || ""}
                  >
                    {account.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {account.region}
                  </div>
                  {account.isPrimary && (
                    <Badge variant="secondary" className="text-xs">
                      Cuenta Primaria
                    </Badge>
                  )}
                  {account.lastConnectedAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Última conexión:{" "}
                      {new Date(account.lastConnectedAt).toLocaleDateString(
                        "es"
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
