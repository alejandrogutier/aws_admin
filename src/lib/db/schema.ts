import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  numeric,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

export const awsAccounts = pgTable("aws_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  roleArn: text("role_arn"),
  externalId: text("external_id"),
  region: text("region").notNull().default("us-east-1"),
  isPrimary: boolean("is_primary").notNull().default(false),
  status: text("status", { enum: ["active", "error", "pending"] })
    .notNull()
    .default("pending"),
  lastConnectedAt: timestamp("last_connected_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const costCache = pgTable(
  "cost_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => awsAccounts.id, { onDelete: "cascade" }),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    granularity: text("granularity", { enum: ["DAILY", "MONTHLY"] }).notNull(),
    serviceName: text("service_name"),
    amount: numeric("amount", { precision: 12, scale: 4 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("cost_cache_unique").on(
      table.accountId,
      table.periodStart,
      table.granularity,
      table.serviceName
    ),
  ]
);

export const tagHistory = pgTable("tag_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => awsAccounts.id, { onDelete: "cascade" }),
  resourceArn: text("resource_arn").notNull(),
  tagKey: text("tag_key").notNull(),
  tagValue: text("tag_value").notNull(),
  action: text("action", { enum: ["added", "removed", "updated"] }).notNull(),
  previousValue: text("previous_value"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
