import "dotenv/config";
import { spawnSync } from "node:child_process";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error(
    "Set TEST_DATABASE_URL to a dedicated, disposable PostgreSQL test database.",
  );
}

const testDatabase = new URL(testDatabaseUrl);
if (!testDatabase.pathname.endsWith("_test")) {
  throw new Error(
    "TEST_DATABASE_URL must target a database whose name ends with _test.",
  );
}

const applicationDatabaseUrl = process.env.DATABASE_URL;
if (applicationDatabaseUrl) {
  const applicationDatabase = new URL(applicationDatabaseUrl);
  if (
    applicationDatabase.host === testDatabase.host &&
    applicationDatabase.pathname === testDatabase.pathname
  ) {
    throw new Error(
      "TEST_DATABASE_URL must not point to the application database.",
    );
  }
}

process.env.DATABASE_URL = testDatabaseUrl;
const executable = process.platform === "win32" ? "npx.cmd" : "npx";

for (const argumentsList of [
  ["prisma", "migrate", "deploy"],
  ["vitest", "run"],
]) {
  const result = spawnSync(executable, argumentsList, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
