import "server-only";
import {
  ResourceGroupsTaggingAPIClient,
  GetResourcesCommand,
  TagResourcesCommand,
  UntagResourcesCommand,
  type TagFilter,
} from "@aws-sdk/client-resource-groups-tagging-api";
import { createAWSClient } from "./client-factory";
import { db } from "@/lib/db";
import { tagHistory } from "@/lib/db/schema";
import type { ResourceTag } from "@/types/aws";

async function getTaggingClient(accountId: string) {
  return createAWSClient(ResourceGroupsTaggingAPIClient, accountId);
}

export async function getResources(
  accountId: string,
  accountName: string,
  filters?: { tagKey?: string; tagValue?: string; resourceType?: string }
): Promise<ResourceTag[]> {
  const client = await getTaggingClient(accountId);

  const tagFilters: TagFilter[] = [];
  if (filters?.tagKey) {
    tagFilters.push({
      Key: filters.tagKey,
      Values: filters.tagValue ? [filters.tagValue] : undefined,
    });
  }

  const command = new GetResourcesCommand({
    TagFilters: tagFilters.length > 0 ? tagFilters : undefined,
    ResourceTypeFilters: filters?.resourceType
      ? [filters.resourceType]
      : undefined,
    ResourcesPerPage: 100,
  });

  const response = await client.send(command);

  return (response.ResourceTagMappingList || []).map((resource) => {
    const tags: Record<string, string> = {};
    for (const tag of resource.Tags || []) {
      if (tag.Key && tag.Value !== undefined) {
        tags[tag.Key] = tag.Value;
      }
    }

    const arn = resource.ResourceARN || "";
    const arnParts = arn.split(":");
    const resourceType = arnParts.length >= 3 ? arnParts[2] : "unknown";

    return {
      resourceArn: arn,
      resourceType,
      tags,
      accountId,
      accountName,
    };
  });
}

export async function tagResources(
  accountId: string,
  resourceArns: string[],
  tags: Record<string, string>
): Promise<void> {
  const client = await getTaggingClient(accountId);
  const command = new TagResourcesCommand({
    ResourceARNList: resourceArns,
    Tags: tags,
  });
  await client.send(command);

  // Log to history
  try {
    for (const arn of resourceArns) {
      for (const [key, value] of Object.entries(tags)) {
        await db.insert(tagHistory).values({
          accountId,
          resourceArn: arn,
          tagKey: key,
          tagValue: value,
          action: "added",
        });
      }
    }
  } catch {
    // History logging is non-critical
  }
}

export async function untagResources(
  accountId: string,
  resourceArns: string[],
  tagKeys: string[]
): Promise<void> {
  const client = await getTaggingClient(accountId);
  const command = new UntagResourcesCommand({
    ResourceARNList: resourceArns,
    TagKeys: tagKeys,
  });
  await client.send(command);

  // Log to history
  try {
    for (const arn of resourceArns) {
      for (const key of tagKeys) {
        await db.insert(tagHistory).values({
          accountId,
          resourceArn: arn,
          tagKey: key,
          tagValue: "",
          action: "removed",
        });
      }
    }
  } catch {
    // History logging is non-critical
  }
}
