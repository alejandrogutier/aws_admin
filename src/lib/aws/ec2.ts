import "server-only";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { createAWSClient } from "./client-factory";
import type { Ec2Instance, InstanceState } from "@/types/aws";

function normalizeState(state: string | undefined): InstanceState {
  switch (state) {
    case "running":
      return "running";
    case "stopped":
      return "stopped";
    case "terminated":
      return "terminated";
    default:
      return "pending";
  }
}

export async function listInstances(
  accountId: string,
  accountName: string
): Promise<Ec2Instance[]> {
  const client = await createAWSClient(EC2Client, accountId);
  const command = new DescribeInstancesCommand({});
  const response = await client.send(command);

  const instances: Ec2Instance[] = [];

  for (const reservation of response.Reservations || []) {
    for (const instance of reservation.Instances || []) {
      const nameTag = instance.Tags?.find((t) => t.Key === "Name");

      instances.push({
        instanceId: instance.InstanceId || "",
        name: nameTag?.Value || instance.InstanceId || "",
        type: instance.InstanceType || "",
        state: normalizeState(instance.State?.Name),
        availabilityZone: instance.Placement?.AvailabilityZone || "",
        publicIp: instance.PublicIpAddress || null,
        privateIp: instance.PrivateIpAddress || null,
        launchTime: instance.LaunchTime || null,
        accountId,
        accountName,
      });
    }
  }

  return instances;
}
