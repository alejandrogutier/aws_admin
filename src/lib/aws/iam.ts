import "server-only";
import {
  IAMClient,
  ListUsersCommand,
  ListGroupsForUserCommand,
  ListAttachedUserPoliciesCommand,
  GetLoginProfileCommand,
} from "@aws-sdk/client-iam";
import { createAWSClient } from "./client-factory";
import type { IamUser } from "@/types/aws";

async function getIAMClient(accountId: string) {
  // IAM is always us-east-1
  return createAWSClient(IAMClient, accountId, {
    regionOverride: "us-east-1",
  });
}

export async function listUsers(
  accountId: string,
  accountName: string
): Promise<IamUser[]> {
  const client = await getIAMClient(accountId);

  const listCommand = new ListUsersCommand({ MaxItems: 100 });
  const response = await client.send(listCommand);

  const users: IamUser[] = [];

  for (const user of response.Users || []) {
    // Get groups
    let groups: string[] = [];
    try {
      const groupsResponse = await client.send(
        new ListGroupsForUserCommand({ UserName: user.UserName! })
      );
      groups = (groupsResponse.Groups || []).map((g) => g.GroupName!);
    } catch {
      // Permission denied for this operation
    }

    // Get attached policies
    let attachedPolicies: string[] = [];
    try {
      const policiesResponse = await client.send(
        new ListAttachedUserPoliciesCommand({ UserName: user.UserName! })
      );
      attachedPolicies = (policiesResponse.AttachedPolicies || []).map(
        (p) => p.PolicyName!
      );
    } catch {
      // Permission denied
    }

    // Check console access
    let hasConsoleAccess = false;
    try {
      await client.send(
        new GetLoginProfileCommand({ UserName: user.UserName! })
      );
      hasConsoleAccess = true;
    } catch {
      // NoSuchEntity means no console access
    }

    users.push({
      userName: user.UserName!,
      userId: user.UserId!,
      arn: user.Arn!,
      createDate: user.CreateDate!,
      passwordLastUsed: user.PasswordLastUsed || null,
      hasConsoleAccess,
      groups,
      attachedPolicies,
      accountId,
      accountName,
    });
  }

  return users;
}
