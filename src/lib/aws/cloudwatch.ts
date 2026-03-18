import "server-only";
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetMetricDataCommand,
  type MetricDataQuery,
} from "@aws-sdk/client-cloudwatch";
import { createAWSClient } from "./client-factory";
import type { CloudWatchAlarm } from "@/types/aws";

export async function listAlarms(
  accountId: string,
  accountName: string
): Promise<CloudWatchAlarm[]> {
  const client = await createAWSClient(CloudWatchClient, accountId);
  const command = new DescribeAlarmsCommand({ MaxRecords: 100 });
  const response = await client.send(command);

  return (response.MetricAlarms || []).map((alarm) => ({
    alarmName: alarm.AlarmName || "",
    state: (alarm.StateValue as CloudWatchAlarm["state"]) || "INSUFFICIENT_DATA",
    metricName: alarm.MetricName || "",
    namespace: alarm.Namespace || "",
    threshold: alarm.Threshold || 0,
    comparisonOperator: alarm.ComparisonOperator || "",
    accountId,
    accountName,
  }));
}

export async function getMetricData(
  accountId: string,
  queries: MetricDataQuery[],
  startTime: Date,
  endTime: Date
): Promise<{ id: string; timestamps: Date[]; values: number[] }[]> {
  const client = await createAWSClient(CloudWatchClient, accountId);
  const command = new GetMetricDataCommand({
    MetricDataQueries: queries,
    StartTime: startTime,
    EndTime: endTime,
  });

  const response = await client.send(command);

  return (response.MetricDataResults || []).map((result) => ({
    id: result.Id || "",
    timestamps: result.Timestamps || [],
    values: result.Values || [],
  }));
}
