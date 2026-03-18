import "server-only";
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from "@aws-sdk/client-rds";
import { createAWSClient } from "./client-factory";
import type { RdsInstance } from "@/types/aws";

export async function listInstances(
  accountId: string,
  accountName: string
): Promise<RdsInstance[]> {
  const client = await createAWSClient(RDSClient, accountId);
  const command = new DescribeDBInstancesCommand({});
  const response = await client.send(command);

  return (response.DBInstances || []).map((db) => ({
    dbInstanceId: db.DBInstanceIdentifier || "",
    engine: db.Engine || "",
    engineVersion: db.EngineVersion || "",
    status: db.DBInstanceStatus || "",
    instanceClass: db.DBInstanceClass || "",
    allocatedStorage: db.AllocatedStorage || 0,
    multiAz: db.MultiAZ || false,
    endpoint: db.Endpoint
      ? `${db.Endpoint.Address}:${db.Endpoint.Port}`
      : null,
    accountId,
    accountName,
  }));
}
