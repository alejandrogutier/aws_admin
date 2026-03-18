import "server-only";
import { LambdaClient, ListFunctionsCommand } from "@aws-sdk/client-lambda";
import { createAWSClient } from "./client-factory";
import type { LambdaFunction } from "@/types/aws";

export async function listFunctions(
  accountId: string,
  accountName: string
): Promise<LambdaFunction[]> {
  const client = await createAWSClient(LambdaClient, accountId);
  const command = new ListFunctionsCommand({ MaxItems: 100 });
  const response = await client.send(command);

  return (response.Functions || []).map((fn) => ({
    functionName: fn.FunctionName || "",
    runtime: fn.Runtime || "unknown",
    memorySize: fn.MemorySize || 128,
    timeout: fn.Timeout || 3,
    lastModified: fn.LastModified || "",
    codeSize: fn.CodeSize || 0,
    accountId,
    accountName,
  }));
}
