import { z } from "zod";

export const FEATURE_STATUSES = ["PLANNED", "IN_PROGRESS", "SHIPPED"] as const;
export const USER_ROLES = ["USER", "ADMIN"] as const;
export const FEATURE_PAGE_SIZE = 20;

export const featureStatusSchema = z.enum(FEATURE_STATUSES);
export const roleSchema = z.enum(USER_ROLES);

export const registerSchema = z.object({
  email: z.string().trim().email().max(254).toLowerCase(),
  name: z.string().trim().min(2).max(80),
  password: z
    .string()
    .min(12)
    .max(72)
    .refine((password) => new TextEncoder().encode(password).length <= 72),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).toLowerCase(),
  password: z
    .string()
    .min(1)
    .max(72)
    .refine((password) => new TextEncoder().encode(password).length <= 72),
});

export const createFeatureSchema = z.object({
  title: z.string().trim().min(5).max(160),
});

export const featureListQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: featureStatusSchema.optional(),
  sortBy: z.enum(["createdAt", "title", "votes"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(FEATURE_PAGE_SIZE),
});

export const statusUpdateParamsSchema = z.object({ id: z.uuid() });
export const statusUpdateBodySchema = z.object({ status: featureStatusSchema });
export const featureIdParamsSchema = z.object({ id: z.uuid() });

export type FeatureStatus = (typeof FEATURE_STATUSES)[number];
export type UserRole = (typeof USER_ROLES)[number];

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type FeatureCard = {
  id: string;
  title: string;
  author: { id: string; name: string };
  votes: number;
  status: FeatureStatus;
  createdAt: string;
  updatedAt: string;
  hasVotedByMe: boolean;
};

export type FeatureListResponse = {
  items: FeatureCard[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type AdminSummaryResponse = {
  total: number;
  planned: number;
  inProgress: number;
  shipped: number;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
  };
};
