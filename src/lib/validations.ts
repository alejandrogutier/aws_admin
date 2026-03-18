import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  roleArn: z
    .string()
    .regex(/^arn:aws:iam::\d{12}:role\/[\w+=,.@-]+$/, "ARN de rol inválido")
    .optional()
    .or(z.literal("")),
  externalId: z.string().max(1224).optional().or(z.literal("")),
  region: z.string().min(1, "La región es requerida"),
});

export const costQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato: YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato: YYYY-MM-DD"),
  granularity: z.enum(["DAILY", "MONTHLY"]).default("MONTHLY"),
  groupBy: z.enum(["SERVICE", "REGION", "NONE"]).default("SERVICE"),
});

export const tagMutationSchema = z.object({
  resourceArns: z.array(z.string().startsWith("arn:")).min(1),
  tags: z.record(z.string().min(1), z.string()),
});

export const tagRemoveSchema = z.object({
  resourceArns: z.array(z.string().startsWith("arn:")).min(1),
  tagKeys: z.array(z.string().min(1)).min(1),
});
