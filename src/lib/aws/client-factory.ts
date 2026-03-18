import "server-only";
import { getAccountCredentials } from "./credentials";

type AwsClientConstructor<T> = new (config: {
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
}) => T;

export async function createAWSClient<T>(
  ClientClass: AwsClientConstructor<T>,
  accountId: string,
  options?: { regionOverride?: string }
): Promise<T> {
  const { credentials, region } = await getAccountCredentials(accountId);

  return new ClientClass({
    region: options?.regionOverride || region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });
}
