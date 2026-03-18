import { Suspense } from "react";
import { getFilteredAccounts } from "@/lib/accounts";
import { listUsers } from "@/lib/aws/iam";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { IamUser } from "@/types/aws";

async function UsersContent({
  accountId,
}: {
  accountId: string | undefined;
}) {
  const accounts = await getFilteredAccounts(accountId);

  const allUsers: IamUser[] = [];

  for (const account of accounts) {
    try {
      const users = await listUsers(account.id, account.name);
      allUsers.push(...users);
    } catch {
      // Skip failed accounts
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {allUsers.length} usuario{allUsers.length !== 1 ? "s" : ""} encontrado
          {allUsers.length !== 1 ? "s" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Grupos</TableHead>
              <TableHead>Políticas</TableHead>
              <TableHead>Consola</TableHead>
              <TableHead>Última Actividad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allUsers.map((user) => (
              <TableRow key={`${user.accountId}-${user.userName}`}>
                <TableCell className="font-medium font-mono">
                  {user.userName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.accountName}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.groups.map((g) => (
                      <Badge key={g} variant="secondary" className="text-xs">
                        {g}
                      </Badge>
                    ))}
                    {user.groups.length === 0 && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.attachedPolicies.slice(0, 3).map((p) => (
                      <Badge key={p} variant="outline" className="text-xs">
                        {p}
                      </Badge>
                    ))}
                    {user.attachedPolicies.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{user.attachedPolicies.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      user.hasConsoleAccess
                        ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/20"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {user.hasConsoleAccess ? "Sí" : "No"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.passwordLastUsed
                    ? new Date(user.passwordLastUsed).toLocaleDateString("es")
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
            {allUsers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Usuarios IAM
        </h1>
        <p className="text-sm text-muted-foreground">
          Usuarios IAM en todas las cuentas conectadas
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-[500px]" />}>
        <UsersContent accountId={params.accountId} />
      </Suspense>
    </div>
  );
}
