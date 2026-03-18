import { Suspense } from "react";
import { getFilteredAccounts } from "@/lib/accounts";
import { listAlarms } from "@/lib/aws/cloudwatch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceStatusBadge } from "@/components/services/service-status-badge";
import type { CloudWatchAlarm } from "@/types/aws";

async function MonitoringContent({
  accountId,
}: {
  accountId: string | undefined;
}) {
  const accounts = await getFilteredAccounts(accountId);

  const allAlarms: CloudWatchAlarm[] = [];

  for (const account of accounts) {
    try {
      const alarms = await listAlarms(account.id, account.name);
      allAlarms.push(...alarms);
    } catch {
      // Skip failed accounts
    }
  }

  const alarmCount = allAlarms.filter((a) => a.state === "ALARM").length;
  const okCount = allAlarms.filter((a) => a.state === "OK").length;
  const insufficientCount = allAlarms.filter(
    (a) => a.state === "INSUFFICIENT_DATA"
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Alarma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono text-red-500">
              {alarmCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              OK
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono text-emerald-500">
              {okCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Datos Insuficientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono text-amber-500">
              {insufficientCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allAlarms.map((alarm) => (
          <Card key={`${alarm.accountId}-${alarm.alarmName}`}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <CardTitle className="text-sm font-medium leading-tight">
                {alarm.alarmName}
              </CardTitle>
              <ServiceStatusBadge status={alarm.state} type="alarm" />
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {alarm.namespace} / {alarm.metricName}
              </p>
              <p className="text-xs font-mono text-muted-foreground">
                {alarm.comparisonOperator} {alarm.threshold}
              </p>
              <p className="text-xs text-muted-foreground">
                {alarm.accountName}
              </p>
            </CardContent>
          </Card>
        ))}
        {allAlarms.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="py-8 text-center text-muted-foreground">
              No se encontraron alarmas de CloudWatch
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default async function MonitoringPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Monitoreo</h1>
        <p className="text-sm text-muted-foreground">
          Alarmas de CloudWatch en todas las cuentas
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-[500px]" />}>
        <MonitoringContent accountId={params.accountId} />
      </Suspense>
    </div>
  );
}
