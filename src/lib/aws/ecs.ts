import "server-only";
import {
  ECSClient,
  ListClustersCommand,
  ListServicesCommand,
  DescribeServicesCommand,
} from "@aws-sdk/client-ecs";
import { createAWSClient } from "./client-factory";
import type { EcsService } from "@/types/aws";

export async function listServices(
  accountId: string,
  accountName: string
): Promise<EcsService[]> {
  const client = await createAWSClient(ECSClient, accountId);

  // List all clusters
  const clustersResponse = await client.send(new ListClustersCommand({}));
  const clusterArns = clustersResponse.clusterArns || [];

  const services: EcsService[] = [];

  for (const clusterArn of clusterArns) {
    const clusterName = clusterArn.split("/").pop() || clusterArn;

    // List services in this cluster
    const servicesResponse = await client.send(
      new ListServicesCommand({ cluster: clusterArn, maxResults: 100 })
    );

    const serviceArns = servicesResponse.serviceArns || [];
    if (serviceArns.length === 0) continue;

    // Describe services (max 10 at a time)
    for (let i = 0; i < serviceArns.length; i += 10) {
      const batch = serviceArns.slice(i, i + 10);
      const describeResponse = await client.send(
        new DescribeServicesCommand({ cluster: clusterArn, services: batch })
      );

      for (const svc of describeResponse.services || []) {
        services.push({
          serviceName: svc.serviceName || "",
          clusterName,
          runningCount: svc.runningCount || 0,
          desiredCount: svc.desiredCount || 0,
          status: svc.status || "UNKNOWN",
          accountId,
          accountName,
        });
      }
    }
  }

  return services;
}
