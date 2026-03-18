import { Suspense } from "react";
import { db } from "@/lib/db";
import { awsAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { format, subMonths } from "date-fns";
import { getCostByService, getMonthlyCosts, getDailyCosts } from "@/lib/aws/costs";
import { CostFilters } from "@/components/costs/cost-filters";
import { CostByServiceChart } from "@/components/dashboard/cost-by-service-chart";
import { CostTrendChart } from "@/components/dashboard/cost-trend-chart";
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
import type { CostByService } from "@/types/aws";

async function CostsContent({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const now = new Date();
  const granularity = searchParams.granularity || "MONTHLY";
  const startDate =
    searchParams.startDate || format(subMonths(now, 6), "yyyy-MM-01");
  const endDate = searchParams.endDate || format(now, "yyyy-MM-dd");
  const accountId = searchParams.accountId;

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

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay cuentas configuradas
        </CardContent>
      </Card>
    );
  }

  // Aggregate costs across accounts
  const allServiceCosts: CostByService[] = [];
  const allTrendData: { period: string; amount: number; currency: string }[] = [];

  for (const account of accounts) {
    try {
      const [serviceCosts, trendData] = await Promise.allSettled([
        getCostByService(account.id, startDate, endDate),
        granularity === "DAILY"
          ? getDailyCosts(account.id, startDate, endDate)
          : getMonthlyCosts(account.id, startDate, endDate),
      ]);

      if (serviceCosts.status === "fulfilled") {
        for (const svc of serviceCosts.value) {
          const existing = allServiceCosts.find(
            (s) => s.service === svc.service
          );
          if (existing) {
            existing.amount += svc.amount;
          } else {
            allServiceCosts.push({ ...svc });
          }
        }
      }

      if (trendData.status === "fulfilled") {
        for (const point of trendData.value) {
          const existing = allTrendData.find((p) => p.period === point.period);
          if (existing) {
            existing.amount += point.amount;
          } else {
            allTrendData.push({ ...point });
          }
        }
      }
    } catch {
      // Skip failed accounts
    }
  }

  // Recalculate percentages
  const total = allServiceCosts.reduce((sum, s) => sum + s.amount, 0);
  allServiceCosts.sort((a, b) => b.amount - a.amount);
  for (const svc of allServiceCosts) {
    svc.percentage = total > 0 ? (svc.amount / total) * 100 : 0;
  }
  allTrendData.sort((a, b) => a.period.localeCompare(b.period));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <CostTrendChart data={allTrendData} />
        <CostByServiceChart data={allServiceCosts} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Detalle por Servicio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">% del Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allServiceCosts.map((svc) => (
                <TableRow key={svc.service}>
                  <TableCell className="font-medium">{svc.service}</TableCell>
                  <TableCell className="text-right font-mono">
                    $
                    {svc.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {svc.percentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
              {allServiceCosts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    No hay datos de costos disponibles
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function CostsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Cost Explorer
        </h1>
        <p className="text-sm text-muted-foreground">
          Análisis detallado de costos por servicio y período
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-10 w-full max-w-xl" />}>
        <CostFilters />
      </Suspense>
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-[380px]" />
              <Skeleton className="h-[380px]" />
            </div>
            <Skeleton className="h-[300px]" />
          </div>
        }
      >
        <CostsContent searchParams={params} />
      </Suspense>
    </div>
  );
}
