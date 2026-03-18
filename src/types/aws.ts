export type AccountStatus = "active" | "error" | "pending";

export type AwsAccount = {
  id: string;
  name: string;
  roleArn: string | null;
  externalId: string | null;
  region: string;
  isPrimary: boolean;
  status: AccountStatus;
  lastConnectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InstanceState = "running" | "stopped" | "terminated" | "pending";

export type Ec2Instance = {
  instanceId: string;
  name: string;
  type: string;
  state: InstanceState;
  availabilityZone: string;
  publicIp: string | null;
  privateIp: string | null;
  launchTime: Date | null;
  accountId: string;
  accountName: string;
};

export type LambdaFunction = {
  functionName: string;
  runtime: string;
  memorySize: number;
  timeout: number;
  lastModified: string;
  codeSize: number;
  accountId: string;
  accountName: string;
};

export type RdsInstance = {
  dbInstanceId: string;
  engine: string;
  engineVersion: string;
  status: string;
  instanceClass: string;
  allocatedStorage: number;
  multiAz: boolean;
  endpoint: string | null;
  accountId: string;
  accountName: string;
};

export type S3Bucket = {
  name: string;
  region: string;
  creationDate: Date | null;
  accountId: string;
  accountName: string;
};

export type EcsService = {
  serviceName: string;
  clusterName: string;
  runningCount: number;
  desiredCount: number;
  status: string;
  accountId: string;
  accountName: string;
};

export type IamUser = {
  userName: string;
  userId: string;
  arn: string;
  createDate: Date;
  passwordLastUsed: Date | null;
  hasConsoleAccess: boolean;
  groups: string[];
  attachedPolicies: string[];
  accountId: string;
  accountName: string;
};

export type CostDataPoint = {
  period: string;
  amount: number;
  currency: string;
};

export type CostByService = {
  service: string;
  amount: number;
  currency: string;
  percentage: number;
};

export type CloudWatchAlarm = {
  alarmName: string;
  state: "OK" | "ALARM" | "INSUFFICIENT_DATA";
  metricName: string;
  namespace: string;
  threshold: number;
  comparisonOperator: string;
  accountId: string;
  accountName: string;
};

export type ResourceTag = {
  resourceArn: string;
  resourceType: string;
  tags: Record<string, string>;
  accountId: string;
  accountName: string;
};

export type DashboardSummary = {
  totalMonthlyCost: number;
  costChange: number;
  totalAccounts: number;
  totalUsers: number;
  totalResources: number;
  ec2Count: number;
  lambdaCount: number;
  rdsCount: number;
  s3Count: number;
  ecsCount: number;
  costTrend: CostDataPoint[];
  costByService: CostByService[];
};
