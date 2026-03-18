export const AWS_REGIONS = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-east-2", label: "US East (Ohio)" },
  { value: "us-west-1", label: "US West (N. California)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-west-1", label: "Europe (Ireland)" },
  { value: "eu-west-2", label: "Europe (London)" },
  { value: "eu-central-1", label: "Europe (Frankfurt)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
  { value: "sa-east-1", label: "South America (Sao Paulo)" },
] as const;

export const SERVICE_COLORS: Record<string, string> = {
  "Amazon EC2": "hsl(var(--chart-1))",
  "Amazon S3": "hsl(var(--chart-2))",
  "Amazon RDS": "hsl(var(--chart-3))",
  "AWS Lambda": "hsl(var(--chart-4))",
  "Amazon ECS": "hsl(var(--chart-5))",
  "Amazon CloudWatch": "hsl(210, 80%, 60%)",
  "AWS CloudTrail": "hsl(280, 60%, 55%)",
  "Amazon Route 53": "hsl(340, 70%, 55%)",
  Other: "hsl(0, 0%, 50%)",
};

export const INSTANCE_STATE_COLORS: Record<string, string> = {
  running: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  stopped: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  terminated: "bg-red-500/15 text-red-500 border-red-500/20",
  pending: "bg-blue-500/15 text-blue-500 border-blue-500/20",
};

export const ALARM_STATE_COLORS: Record<string, string> = {
  OK: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  ALARM: "bg-red-500/15 text-red-500 border-red-500/20",
  INSUFFICIENT_DATA: "bg-amber-500/15 text-amber-500 border-amber-500/20",
};

export const COST_CACHE_TTL = {
  daily: 6 * 60 * 60 * 1000, // 6 hours
  monthly: 24 * 60 * 60 * 1000, // 24 hours
} as const;

export const STS_CREDENTIAL_TTL = 50 * 60 * 1000; // 50 minutes
