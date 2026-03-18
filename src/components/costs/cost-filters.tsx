"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function CostFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const granularity = searchParams.get("granularity") || "MONTHLY";
  const startDate =
    searchParams.get("startDate") ||
    new Date(new Date().setMonth(new Date().getMonth() - 6))
      .toISOString()
      .split("T")[0];
  const endDate =
    searchParams.get("endDate") || new Date().toISOString().split("T")[0];

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground whitespace-nowrap">
          Desde
        </label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => updateParam("startDate", e.target.value)}
          className="w-40"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground whitespace-nowrap">
          Hasta
        </label>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => updateParam("endDate", e.target.value)}
          className="w-40"
        />
      </div>
      <Select
        value={granularity}
        onValueChange={(v) => { if (v) updateParam("granularity", v); }}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="MONTHLY">Mensual</SelectItem>
          <SelectItem value="DAILY">Diario</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
