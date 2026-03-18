import "server-only";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import { createAWSClient } from "./client-factory";
import type { S3Bucket } from "@/types/aws";

export async function listBuckets(
  accountId: string,
  accountName: string
): Promise<S3Bucket[]> {
  const client = await createAWSClient(S3Client, accountId, {
    regionOverride: "us-east-1",
  });
  const command = new ListBucketsCommand({});
  const response = await client.send(command);

  return (response.Buckets || []).map((bucket) => ({
    name: bucket.Name || "",
    region: "us-east-1", // ListBuckets doesn't return region per bucket
    creationDate: bucket.CreationDate || null,
    accountId,
    accountName,
  }));
}
