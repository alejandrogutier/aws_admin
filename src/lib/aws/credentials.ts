import "server-only";
import {
  STSClient,
  AssumeRoleCommand,
  GetCallerIdentityCommand,
} from "@aws-sdk/client-sts";
import type { AwsCredentialIdentity } from "@aws-sdk/types";
import { STS_CREDENTIAL_TTL } from "@/lib/constants";
import { db } from "@/lib/db";
import { awsAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type CachedCredential = {
  credentials: AwsCredentialIdentity;
  expiresAt: Date;
  region: string;
};

const credentialCache = new Map<string, CachedCredential>();

function getPrimaryCredentials(): AwsCredentialIdentity & { region: string } {
  // Support both AWS_* (local) and ADMIN_AWS_* (Amplify, where AWS_ prefix is reserved)
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.ADMIN_AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.ADMIN_AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || process.env.ADMIN_AWS_REGION || "us-east-1";

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS credentials must be set (AWS_ACCESS_KEY_ID or ADMIN_AWS_ACCESS_KEY_ID)"
    );
  }

  return { accessKeyId, secretAccessKey, region };
}

function isCacheValid(cached: CachedCredential): boolean {
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return cached.expiresAt > fiveMinutesFromNow;
}

async function assumeRole(
  roleArn: string,
  externalId: string | null,
  region: string
): Promise<CachedCredential> {
  const primary = getPrimaryCredentials();
  const stsClient = new STSClient({
    region: primary.region,
    credentials: {
      accessKeyId: primary.accessKeyId,
      secretAccessKey: primary.secretAccessKey,
    },
  });

  const params: {
    RoleArn: string;
    RoleSessionName: string;
    DurationSeconds: number;
    ExternalId?: string;
  } = {
    RoleArn: roleArn,
    RoleSessionName: `aws-admin-${Date.now()}`,
    DurationSeconds: 3600,
  };

  if (externalId) {
    params.ExternalId = externalId;
  }

  const command = new AssumeRoleCommand(params);
  const response = await stsClient.send(command);

  if (!response.Credentials) {
    throw new Error(`AssumeRole failed for ${roleArn}: no credentials returned`);
  }

  return {
    credentials: {
      accessKeyId: response.Credentials.AccessKeyId!,
      secretAccessKey: response.Credentials.SecretAccessKey!,
      sessionToken: response.Credentials.SessionToken!,
    },
    expiresAt: response.Credentials.Expiration || new Date(Date.now() + STS_CREDENTIAL_TTL),
    region,
  };
}

export async function getAccountCredentials(
  accountId: string
): Promise<{ credentials: AwsCredentialIdentity; region: string }> {
  // Virtual env account — use env vars directly
  if (accountId === "env-primary") {
    const primary = getPrimaryCredentials();
    return {
      credentials: {
        accessKeyId: primary.accessKeyId,
        secretAccessKey: primary.secretAccessKey,
      },
      region: primary.region,
    };
  }

  // Check cache first
  const cached = credentialCache.get(accountId);
  if (cached && isCacheValid(cached)) {
    return { credentials: cached.credentials, region: cached.region };
  }

  // Look up account in DB
  const account = await db.query.awsAccounts.findFirst({
    where: eq(awsAccounts.id, accountId),
  });

  if (!account) {
    throw new Error(`Account ${accountId} not found`);
  }

  // Primary account uses env vars directly
  if (account.isPrimary || !account.roleArn) {
    const primary = getPrimaryCredentials();
    return {
      credentials: {
        accessKeyId: primary.accessKeyId,
        secretAccessKey: primary.secretAccessKey,
      },
      region: account.region,
    };
  }

  // Cross-account: AssumeRole
  const result = await assumeRole(
    account.roleArn,
    account.externalId,
    account.region
  );

  credentialCache.set(accountId, result);

  return { credentials: result.credentials, region: result.region };
}

export async function validateConnection(
  accountId?: string,
  roleArn?: string,
  externalId?: string | null,
  region?: string
): Promise<{ success: boolean; accountIdResult?: string; error?: string }> {
  try {
    let credentials: AwsCredentialIdentity;
    let targetRegion: string;

    if (accountId) {
      const result = await getAccountCredentials(accountId);
      credentials = result.credentials;
      targetRegion = result.region;
    } else if (roleArn) {
      const result = await assumeRole(
        roleArn,
        externalId || null,
        region || "us-east-1"
      );
      credentials = result.credentials;
      targetRegion = region || "us-east-1";
    } else {
      const primary = getPrimaryCredentials();
      credentials = primary;
      targetRegion = primary.region;
    }

    const stsClient = new STSClient({
      region: targetRegion,
      credentials,
    });

    const identity = await stsClient.send(new GetCallerIdentityCommand({}));

    return {
      success: true,
      accountIdResult: identity.Account,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

export function clearCredentialCache(accountId?: string) {
  if (accountId) {
    credentialCache.delete(accountId);
  } else {
    credentialCache.clear();
  }
}
