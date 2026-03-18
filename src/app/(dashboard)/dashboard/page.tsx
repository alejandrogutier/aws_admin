import { Suspense } from "react";
import { db } from "@/lib/db";
import { awsAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { format, subMonths } from "date-fns";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { CostTrendChart } from "@/components/dashboard/cost-trend-chart";
import { CostByServiceChart } from "@/components/dashboard/cost-by-service-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { getMonthlyCosts, getCostByService } from "@/lib/aws/costs";
import * as ec2 from "@/lib/aws/ec2";
import * as lambda from "@/lib/aws/lambda";
import * as rds from "@/lib/aws/rds";
import * as s3 from "@/lib/aws/s3";
import * as iam from "@/lib/aws/iam";
import type { CostDataPoint, CostByService as CostByServiceType } from "@/types/aws";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[380px]" />
        <Skeleton className="h-[380px]" />
      </div>
    </div>
  );
}

async function DashboardContent() {
  let accounts: { id: string; name: string }[] = [];
  try {
    accounts = await db
      .select({ id: awsAccounts.id, name: awsAccounts.name })
      .from(awsAccounts)
      .where(eq(awsAccounts.status, "active"));
  } catch {
    // DB not available
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-medium">Bienvenido a AWS Admin</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Ve a <strong>Cuentas</strong> para agregar tu primera cuenta AWS
          </p>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const sixMonthsAgo = subMonths(now, 6);
  const startDate = format(sixMonthsAgo, "yyyy-MM-01");
  const endDate = format(now, "yyyy-MM-dd");
  const currentMonthStart = format(now, "yyyy-MM-01");

  // Fetch data from all accounts in parallel
  const results = await Promise.allSettled(
    accounts.map(async (account) => {
      const [costTrend, costByService, ec2Instances, lambdaFns, rdsInstances, s3Buckets, iamUsers] =
        await Promise.allSettled([
          getMonthlyCosts(account.id, startDate, endDate),
          getCostByService(account.id, currentMonthStart, endDate),
          ec2.listInstances(account.id, account.name),
          lambda.listFunctions(account.id, account.name),
          rds.listInstances(account.id, account.name),
          s3.listBuckets(account.id, account.name),
          iam.listUsers(account.id, account.name),
        ]);

      return {
        costTrend: costTrend.status === "fulfilled" ? costTrend.value : [],
        costByService: costByService.status === "fulfilled" ? costByService.value : [],
        ec2Count: ec2Instances.status === "fulfilled" ? ec2Instances.value.length : 0,
        lambdaCount: lambdaFns.status === "fulfilled" ? lambdaFns.value.length : 0,
        rdsCount: rdsInstances.status === "fulfilled" ? rdsInstances.value.length : 0,
        s3Count: s3Buckets.status === "fulfilled" ? s3Buckets.value.length : 0,
        userCount: iamUsers.status === "fulfilled" ? iamUsers.value.length : 0,
      };
    })
  );

  // Aggregate data
  let totalUsers = 0;
  let totalEc2 = 0;
  let totalLambda = 0;
  let totalRds = 0;
  let totalS3 = 0;
  const allCostTrend: CostDataPoint[] = [];
  const serviceMap = new Map<string, number>();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const data = result.value;

    totalUsers += data.userCount;
    totalEc2 += data.ec2Count;
    totalLambda += data.lambdaCount;
    totalRds += data.rdsCount;
    totalS3 += data.s3Count;

    for (const point of data.costTrend) {
      const existing = allCostTrend.find((p) => p.period === point.period);
      if (existing) {
        existing.amount += point.amount;
      } else {
        allCostTrend.push({ ...point });
      }
    }

    for (const svc of data.costByService) {
      serviceMap.set(
        svc.service,
        (serviceMap.get(svc.service) || 0) + svc.amount
      );
    }
  }

  allCostTrend.sort((a, b) => a.period.localeCompare(b.period));

  const totalResources = totalEc2 + totalLambda + totalRds + totalS3;

  // Calculate current month cost and change
  const currentCost = allCostTrend.length > 0
    ? allCostTrend[allCostTrend.length - 1].amount
    : 0;
  const previousCost = allCostTrend.length > 1
    ? allCostTrend[allCostTrend.length - 2].amount
    : 0;
  const costChange = previousCost > 0
    ? ((currentCost - previousCost) / previousCost) * 100
    : 0;

  const totalServiceCost = Array.from(serviceMap.values()).reduce((a, b) => a + b, 0);
  const costByService: CostByServiceType[] = Array.from(serviceMap.entries())
    .map(([service, amount]) => ({
      service,
      amount,
      currency: "USD",
      percentage: totalServiceCost > 0 ? (amount / totalServiceCost) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6">
      <SummaryCards
        totalMonthlyCost={currentCost}
        costChange={costChange}
        totalAccounts={accounts.length}
        totalUsers={totalUsers}
        totalResources={totalResources}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <CostTrendChart data={allCostTrend} />
        <CostByServiceChart data={costByService} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen global de todas las cuentas AWS
        </p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
