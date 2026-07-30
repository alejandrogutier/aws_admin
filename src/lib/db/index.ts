import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { RUNTIME_SECRETS } from "@/lib/aws-config.generated";

const pool = new Pool({
  // Amplify env vars are absent in the SSR runtime, so fall back to the value
  // baked in at build time by amplify.yml.
  connectionString: process.env.DATABASE_URL || RUNTIME_SECRETS.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;
