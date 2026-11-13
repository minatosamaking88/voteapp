import { z } from "zod";

export const FEATURE_STATUSES = ["PLANNED", "IN_PROGRESS", "SHIPPED"] as const;
export const FEATURE_TITLE_MIN_LENGTH = 5;
export const FEATURE_TITLE_MAX_LENGTH = 120;
export const FEATURE_DESCRIPTION_MIN_LENGTH = 20;
export const FEATURE_DESCRIPTION_MAX_LENGTH = 2000;
export const FEATURE_SEARCH_MAX_LENGTH = 120;
export const DEFAULT_FEATURE_PAGE_SIZE = 20;
export const DISPLAY_NAME_MAX_LENGTH = 80;
export const EMAIL_MAX_LENGTH = 320;
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_MAX_UTF8_BYTES = 72;

export const FeatureStatusSchema = z.enum(FEATURE_STATUSES);
export type FeatureStatus = z.infer<typeof FeatureStatusSchema>;

export const FEATURE_STATUS_LABELS: Record<FeatureStatus, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  SHIPPED: "Shipped",
};

export const featureInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(FEATURE_TITLE_MIN_LENGTH, "Use at least 5 characters.")
      .max(FEATURE_TITLE_MAX_LENGTH),
    description: z
      .string()
      .trim()
      .min(FEATURE_DESCRIPTION_MIN_LENGTH, "Use at least 20 characters.")
      .max(FEATURE_DESCRIPTION_MAX_LENGTH),
  })
  .strict();

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(EMAIL_MAX_LENGTH)
  .toLowerCase();

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, "Use at least 12 characters.")
  .max(PASSWORD_MAX_LENGTH, "Use no more than 128 characters.")
  .refine(
    (value) =>
      new TextEncoder().encode(value).length <= PASSWORD_MAX_UTF8_BYTES,
    { message: "Use a password of at most 72 UTF-8 bytes." },
  );

export const registerInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Enter your display name.")
      .max(DISPLAY_NAME_MAX_LENGTH),
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const loginInputSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const featureListQuerySchema = z
  .object({
    q: z.string().trim().max(FEATURE_SEARCH_MAX_LENGTH).optional(),
    status: z.preprocess(
      (value) => (value === "" ? undefined : value),
      FeatureStatusSchema.optional(),
    ),
    sort: z.enum(["votes", "newest"]).default("votes"),
    page: z.coerce.number().int().positive().safe().default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(DEFAULT_FEATURE_PAGE_SIZE)
      .default(DEFAULT_FEATURE_PAGE_SIZE),
  })
  .strict();

export const featureIdSchema = z.string().uuid();

export type FeatureInput = z.infer<typeof featureInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type FeatureListQuery = z.infer<typeof featureListQuerySchema>;

export type PublicUser = {
  id: string;
  name: string;
};

export type FeatureItem = {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
  author: PublicUser;
  voteCount: number;
  hasVoted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FeatureListResponse = {
  items: FeatureItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type VoteResponse = {
  featureId: string;
  voteCount: number;
  hasVoted: boolean;
};
