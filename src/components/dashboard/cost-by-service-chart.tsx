"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CostByService } from "@/types/aws";

type CostByServiceChartProps = {
  data: CostByService[];
};

export function CostByServiceChart({ data }: CostByServiceChartProps) {
  const chartData = data.slice(0, 10).map((d) => ({
    service: d.service.replace("Amazon ", "").replace("AWS ", ""),
    amount: d.amount,
    percentage: d.percentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Costos por Servicio (Top 10)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
                horizontal={false}
              />
              <XAxis
                type="number"
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
              />
              <YAxis
                type="category"
                dataKey="service"
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="text-sm font-medium">{data.service}</p>
                      <p className="text-sm font-mono text-muted-foreground">
                        ${Number(data.amount).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        ({data.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="amount"
                fill="hsl(var(--chart-2))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
