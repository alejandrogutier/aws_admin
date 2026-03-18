import { Suspense } from "react";
import { db } from "@/lib/db";
import { awsAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getResources } from "@/lib/aws/tagging";
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
import type { ResourceTag } from "@/types/aws";

async function TagsContent({
  accountId,
}: {
  accountId: string | undefined;
}) {
  let accounts: { id: string; name: string }[] = [];
  try {
    if (accountId) {
      const account = await db.query.awsAccounts.findFirst({
        where: eq(awsAccounts.id, accountId),
        columns: { id: true, name: true },
      });
      if (account) accounts = [account];
    } else {
      accounts = await db
        .select({ id: awsAccounts.id, name: awsAccounts.name })
        .from(awsAccounts)
        .where(eq(awsAccounts.status, "active"));
    }
  } catch {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No se pudo conectar a la base de datos
        </CardContent>
      </Card>
    );
  }

  const allResources: ResourceTag[] = [];

  for (const account of accounts) {
    try {
      const resources = await getResources(account.id, account.name);
      allResources.push(...resources);
    } catch {
      // Skip failed accounts
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {allResources.length} recurso{allResources.length !== 1 ? "s" : ""}{" "}
          etiquetado{allResources.length !== 1 ? "s" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ARN del Recurso</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Etiquetas</TableHead>
              <TableHead>Cuenta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allResources.map((resource) => (
              <TableRow key={`${resource.accountId}-${resource.resourceArn}`}>
                <TableCell className="font-mono text-xs max-w-[300px] truncate">
                  {resource.resourceArn}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{resource.resourceType}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(resource.tags)
                      .slice(0, 5)
                      .map(([key, value]) => (
                        <Badge
                          key={key}
                          variant="outline"
                          className="text-xs font-mono"
                        >
                          {key}: {value}
                        </Badge>
                      ))}
                    {Object.keys(resource.tags).length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{Object.keys(resource.tags).length - 5}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {resource.accountName}
                </TableCell>
              </TableRow>
            ))}
            {allResources.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  No se encontraron recursos etiquetados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default async function TagsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Etiquetas</h1>
        <p className="text-sm text-muted-foreground">
          Gestión de etiquetas (tags) en recursos AWS
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-[500px]" />}>
        <TagsContent accountId={params.accountId} />
      </Suspense>
    </div>
  );
}
