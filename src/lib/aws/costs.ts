import "server-only";
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  type Granularity,
} from "@aws-sdk/client-cost-explorer";
import { createAWSClient } from "./client-factory";
import { db } from "@/lib/db";
import { costCache } from "@/lib/db/schema";
import { and, eq, gte } from "drizzle-orm";
import { COST_CACHE_TTL } from "@/lib/constants";
import type { CostDataPoint, CostByService } from "@/types/aws";

async function getCostClient(accountId: string) {
  return createAWSClient(CostExplorerClient, accountId, {
    regionOverride: "us-east-1",
  });
}

export async function getMonthlyCosts(
  accountId: string,
  startDate: string,
  endDate: string
): Promise<CostDataPoint[]> {
  // Check cache
  const cacheTTL = new Date(Date.now() - COST_CACHE_TTL.monthly);
  try {
    const cached = await db
      .select()
      .from(costCache)
      .where(
        and(
          eq(costCache.accountId, accountId),
          eq(costCache.granularity, "MONTHLY"),
          eq(costCache.periodStart, startDate),
          gte(costCache.fetchedAt, cacheTTL)
        )
      );

    if (cached.length > 0) {
      return cached
        .filter((c) => !c.serviceName)
        .map((c) => ({
          period: c.periodStart,
          amount: parseFloat(c.amount),
          currency: c.currency,
        }));
    }
  } catch {
    // DB not available, skip cache
  }

  const client = await getCostClient(accountId);
  const command = new GetCostAndUsageCommand({
    TimePeriod: { Start: startDate, End: endDate },
    Granularity: "MONTHLY" as Granularity,
    Metrics: ["BlendedCost"],
  });

  const response = await client.send(command);

  const results: CostDataPoint[] = (response.ResultsByTime || []).map((r) => ({
    period: r.TimePeriod?.Start || "",
    amount: parseFloat(r.Total?.BlendedCost?.Amount || "0"),
    currency: r.Total?.BlendedCost?.Unit || "USD",
  }));

  // Store in cache
  try {
    for (const result of results) {
      await db
        .insert(costCache)
        .values({
          accountId,
          periodStart: result.period,
          periodEnd: endDate,
          granularity: "MONTHLY",
          serviceName: null,
          amount: result.amount.toFixed(4),
          currency: result.currency,
        })
        .onConflictDoUpdate({
          target: [
            costCache.accountId,
            costCache.periodStart,
            costCache.granularity,
            costCache.serviceName,
          ],
          set: {
            amount: result.amount.toFixed(4),
            fetchedAt: new Date(),
          },
        });
    }
  } catch {
    // Cache write failure is non-critical
  }

  return results;
}

export async function getCostByService(
  accountId: string,
  startDate: string,
  endDate: string
): Promise<CostByService[]> {
  const client = await getCostClient(accountId);
  const command = new GetCostAndUsageCommand({
    TimePeriod: { Start: startDate, End: endDate },
    Granularity: "MONTHLY" as Granularity,
    Metrics: ["BlendedCost"],
    GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
  });

  const response = await client.send(command);

  const serviceMap = new Map<string, number>();
  let total = 0;

  for (const result of response.ResultsByTime || []) {
    for (const group of result.Groups || []) {
      const service = group.Keys?.[0] || "Unknown";
      const amount = parseFloat(group.Metrics?.BlendedCost?.Amount || "0");
      serviceMap.set(service, (serviceMap.get(service) || 0) + amount);
      total += amount;
    }
  }

  return Array.from(serviceMap.entries())
    .map(([service, amount]) => ({
      service,
      amount,
      currency: "USD",
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export async function getDailyCosts(
  accountId: string,
  startDate: string,
  endDate: string
): Promise<CostDataPoint[]> {
  const client = await getCostClient(accountId);
  const command = new GetCostAndUsageCommand({
    TimePeriod: { Start: startDate, End: endDate },
    Granularity: "DAILY" as Granularity,
    Metrics: ["BlendedCost"],
  });

  const response = await client.send(command);

  return (response.ResultsByTime || []).map((r) => ({
    period: r.TimePeriod?.Start || "",
    amount: parseFloat(r.Total?.BlendedCost?.Amount || "0"),
    currency: r.Total?.BlendedCost?.Unit || "USD",
  }));
}
