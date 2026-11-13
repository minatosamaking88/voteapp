import "dotenv/config";
import { spawnSync } from "node:child_process";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error(
    "Set TEST_DATABASE_URL to a dedicated PostgreSQL test database.",
  );
}

const databaseName = decodeURIComponent(
  new URL(testDatabaseUrl).pathname.slice(1),
);
if (!databaseName.endsWith("_test")) {
  throw new Error(
    "The PostgreSQL integration test database name must end in _test.",
  );
}

const environment = { ...process.env, DATABASE_URL: testDatabaseUrl };
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const migration = spawnSync(npxCommand, ["prisma", "migrate", "deploy"], {
  env: environment,
  stdio: "inherit",
});

if (migration.error) throw migration.error;
if (migration.status !== 0) {
  process.exitCode = migration.status ?? 1;
} else {
  const tests = spawnSync(
    npxCommand,
    ["vitest", "run", "--config", "vitest.config.ts"],
    {
      env: environment,
      stdio: "inherit",
    },
  );
  if (tests.error) throw tests.error;
  process.exitCode = tests.status ?? 1;
}
