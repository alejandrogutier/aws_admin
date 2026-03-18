import { Badge } from "@/components/ui/badge";
import { INSTANCE_STATE_COLORS, ALARM_STATE_COLORS } from "@/lib/constants";

type ServiceStatusBadgeProps = {
  status: string;
  type?: "instance" | "alarm";
};

export function ServiceStatusBadge({
  status,
  type = "instance",
}: ServiceStatusBadgeProps) {
  const colorMap =
    type === "alarm" ? ALARM_STATE_COLORS : INSTANCE_STATE_COLORS;
  const className = colorMap[status] || "bg-muted text-muted-foreground";

  return (
    <Badge variant="outline" className={className}>
      {status}
    </Badge>
  );
}
