import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv({ path: resolve(import.meta.dirname, '../../.env') });

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  APP_ORIGIN: z
    .string()
    .url()
    .transform((value) => new URL(value).origin),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  throw new Error(`Invalid server environment: ${parsedEnvironment.error.message}`);
}

export const config = parsedEnvironment.data;
