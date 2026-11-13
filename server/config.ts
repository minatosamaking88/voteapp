import "dotenv/config";
import { z } from "zod";

const serverEnvironmentSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
});

const parsedEnvironment = serverEnvironmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const missingSettings = parsedEnvironment.error.issues
    .map((issue) => issue.path.join("."))
    .join(", ");
  throw new Error(`Invalid server configuration: ${missingSettings}`);
}

export const config = {
  databaseUrl: parsedEnvironment.data.DATABASE_URL,
  port: parsedEnvironment.data.PORT,
  environment: parsedEnvironment.data.NODE_ENV,
  webOrigin: parsedEnvironment.data.WEB_ORIGIN,
  trustProxyHops: parsedEnvironment.data.TRUST_PROXY_HOPS,
  secureCookies: parsedEnvironment.data.NODE_ENV === "production",
};
