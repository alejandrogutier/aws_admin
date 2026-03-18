import {
  DollarSign,
  Building2,
  Users,
  Server,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SummaryCardsProps = {
  totalMonthlyCost: number;
  costChange: number;
  totalAccounts: number;
  totalUsers: number;
  totalResources: number;
};

export function SummaryCards({
  totalMonthlyCost,
  costChange,
  totalAccounts,
  totalUsers,
  totalResources,
}: SummaryCardsProps) {
  const cards = [
    {
      title: "Costo Mensual",
      value: `$${totalMonthlyCost.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      change: costChange,
      icon: DollarSign,
    },
    {
      title: "Cuentas Activas",
      value: totalAccounts.toString(),
      icon: Building2,
    },
    {
      title: "Usuarios IAM",
      value: totalUsers.toString(),
      icon: Users,
    },
    {
      title: "Recursos Activos",
      value: totalResources.toString(),
      icon: Server,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{card.value}</div>
            {card.change !== undefined && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                {card.change >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-red-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-emerald-500" />
                )}
                <span
                  className={
                    card.change >= 0 ? "text-red-500" : "text-emerald-500"
                  }
                >
                  {Math.abs(card.change).toFixed(1)}%
                </span>{" "}
                vs mes anterior
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
