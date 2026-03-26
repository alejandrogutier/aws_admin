import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { awsAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { format, subMonths } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { CostTrendChart } from "@/components/dashboard/cost-trend-chart";
import { CostByServiceChart } from "@/components/dashboard/cost-by-service-chart";
import { getMonthlyCosts, getCostByService } from "@/lib/aws/costs";
import * as ec2Lib from "@/lib/aws/ec2";
import * as lambdaLib from "@/lib/aws/lambda";
import * as rdsLib from "@/lib/aws/rds";
import * as s3Lib from "@/lib/aws/s3";
import * as iamLib from "@/lib/aws/iam";
import { AWS_CONFIG } from "@/lib/aws-config.generated";
import { MapPin, Clock, Key } from "lucide-react";

type AccountInfo = {
  id: string;
  name: string;
  region: string;
  isPrimary: boolean;
  lastConnectedAt: Date | null;
  isEnvAccount?: boolean;
};

async function getAccountInfo(accountId: string): Promise<AccountInfo | null> {
  if (accountId === "env-primary") {
    if (!AWS_CONFIG.accessKeyId || !AWS_CONFIG.secretAccessKey) return null;
    return {
      id: "env-primary",
      name: AWS_CONFIG.username || "Cuenta Principal",
      region: AWS_CONFIG.region || "us-east-1",
      isPrimary: true,
      lastConnectedAt: null,
      isEnvAccount: true,
    };
  }

  try {
    const dbAccount = await db.query.awsAccounts.findFirst({
      where: eq(awsAccounts.id, accountId),
    });
    if (!dbAccount) return null;
    return {
      id: dbAccount.id,
      name: dbAccount.name,
      region: dbAccount.region,
      isPrimary: dbAccount.isPrimary,
      lastConnectedAt: dbAccount.lastConnectedAt,
    };
  } catch {
    return null;
  }
}

async function AccountDashboard({ accountId }: { accountId: string }) {
  const account = await getAccountInfo(accountId);

  if (!account) notFound();

  const now = new Date();
  const sixMonthsAgo = subMonths(now, 6);
  const startDate = format(sixMonthsAgo, "yyyy-MM-01");
  const endDate = format(now, "yyyy-MM-dd");
  const currentMonthStart = format(now, "yyyy-MM-01");

  const [costTrend, costByService, ec2Instances, lambdaFns, rdsInstances, s3Buckets, iamUsers] =
    await Promise.allSettled([
      getMonthlyCosts(account.id, startDate, endDate),
      getCostByService(account.id, currentMonthStart, endDate),
      ec2Lib.listInstances(account.id, account.name),
      lambdaLib.listFunctions(account.id, account.name),
      rdsLib.listInstances(account.id, account.name),
      s3Lib.listBuckets(account.id, account.name),
      iamLib.listUsers(account.id, account.name),
    ]);

  const trend = costTrend.status === "fulfilled" ? costTrend.value : [];
  const services = costByService.status === "fulfilled" ? costByService.value : [];
  const ec2Count = ec2Instances.status === "fulfilled" ? ec2Instances.value.length : 0;
  const lambdaCount = lambdaFns.status === "fulfilled" ? lambdaFns.value.length : 0;
  const rdsCount = rdsInstances.status === "fulfilled" ? rdsInstances.value.length : 0;
  const s3Count = s3Buckets.status === "fulfilled" ? s3Buckets.value.length : 0;
  const userCount = iamUsers.status === "fulfilled" ? iamUsers.value.length : 0;

  const currentCost = trend.length > 0 ? trend[trend.length - 1].amount : 0;
  const previousCost = trend.length > 1 ? trend[trend.length - 2].amount : 0;
  const costChange = previousCost > 0
    ? ((currentCost - previousCost) / previousCost) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {account.name}
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {account.region}
            </span>
            {account.isPrimary && (
              <Badge variant="secondary">Cuenta Primaria</Badge>
            )}
            {account.isEnvAccount && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Key className="h-3 w-3" />
                Configurada vía .env
              </span>
            )}
            {account.lastConnectedAt && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Última conexión:{" "}
                {new Date(account.lastConnectedAt).toLocaleDateString("es")}
              </span>
            )}
          </div>
        </div>
      </div>

      <SummaryCards
        totalMonthlyCost={currentCost}
        costChange={costChange}
        totalAccounts={1}
        totalUsers={userCount}
        totalResources={ec2Count + lambdaCount + rdsCount + s3Count}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <CostTrendChart data={trend} />
        <CostByServiceChart data={services} />
      </div>
    </div>
  );
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-16 w-1/3" />
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
      }
    >
      <AccountDashboard accountId={id} />
    </Suspense>
  );
}
