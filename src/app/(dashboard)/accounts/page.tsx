import { db } from "@/lib/db";
import { awsAccounts } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddAccountDialog } from "@/components/accounts/add-account-dialog";
import { Building2, MapPin, Clock, Key, AlertTriangle } from "lucide-react";
import { AWS_CONFIG } from "@/lib/aws-config.generated";
import Link from "next/link";

type AccountDisplay = {
  id: string;
  name: string;
  status: string;
  region: string;
  isPrimary: boolean;
  lastConnectedAt: Date | null;
  isEnvAccount?: boolean;
  username?: string;
};

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  error: "bg-red-500/15 text-red-500 border-red-500/20",
  pending: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  configured: "bg-blue-500/15 text-blue-500 border-blue-500/20",
};

function getEnvPrimaryAccount(): AccountDisplay | null {
  if (!AWS_CONFIG.accessKeyId || !AWS_CONFIG.secretAccessKey) {
    return null;
  }
  return {
    id: "env-primary",
    name: AWS_CONFIG.username || "Cuenta Principal",
    status: "active",
    region: AWS_CONFIG.region || "us-east-1",
    isPrimary: true,
    lastConnectedAt: null,
    isEnvAccount: true,
    username: AWS_CONFIG.username,
  };
}

export default async function AccountsPage() {
  let dbAccounts: (typeof awsAccounts.$inferSelect)[] = [];
  let dbAvailable = true;

  try {
    dbAccounts = await db.select().from(awsAccounts);
  } catch {
    dbAvailable = false;
  }

  const envAccount = getEnvPrimaryAccount();
  const allAccounts: AccountDisplay[] = [];

  // Siempre mostrar la cuenta primaria del .env si está configurada
  if (envAccount) {
    allAccounts.push(envAccount);
  }

  // Agregar cuentas de la DB (excluyendo la primaria si ya la mostramos del env)
  for (const acc of dbAccounts) {
    if (envAccount && acc.isPrimary && !acc.roleArn) continue;
    allAccounts.push({
      id: acc.id,
      name: acc.name,
      status: acc.status,
      region: acc.region,
      isPrimary: acc.isPrimary,
      lastConnectedAt: acc.lastConnectedAt,
    });
  }

  const envConfigured = !!AWS_CONFIG.accessKeyId && !!AWS_CONFIG.secretAccessKey;

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

      {!envConfigured && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-500">
                Credenciales AWS no configuradas
              </p>
              <p className="text-xs text-muted-foreground">
                Configura las siguientes variables de entorno en tu archivo{" "}
                <code className="rounded bg-muted px-1 py-0.5">.env</code>:
              </p>
              <div className="mt-2 rounded-md bg-muted/50 p-3 font-mono text-xs space-y-1">
                <p>AWS_ACCESS_KEY_ID=tu_access_key</p>
                <p>AWS_SECRET_ACCESS_KEY=tu_secret_key</p>
                <p>AWS_REGION=us-east-1</p>
                <p>AWS_USERNAME=tu_usuario (opcional)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!dbAvailable && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-500">
                Base de datos no disponible
              </p>
              <p className="text-xs text-muted-foreground">
                Para agregar cuentas adicionales (cross-account), configura{" "}
                <code className="rounded bg-muted px-1 py-0.5">DATABASE_URL</code>{" "}
                en tu archivo{" "}
                <code className="rounded bg-muted px-1 py-0.5">.env</code>:
              </p>
              <div className="mt-2 rounded-md bg-muted/50 p-3 font-mono text-xs">
                <p>DATABASE_URL=postgresql://user:password@host:5432/aws_admin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {allAccounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">
              No hay cuentas configuradas
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Configura tus credenciales AWS en el archivo .env para comenzar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allAccounts.map((account) => {
            const isEnv = account.isEnvAccount;
            const content = (
              <Card className="transition-colors hover:border-primary/50 h-full">
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
                  {isEnv && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Key className="h-3 w-3" />
                      Configurada vía .env
                    </div>
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
            );

            if (isEnv) {
              return (
                <Link key={account.id} href={`/accounts/${account.id}`}>
                  {content}
                </Link>
              );
            }

            return (
              <Link key={account.id} href={`/accounts/${account.id}`}>
                {content}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
