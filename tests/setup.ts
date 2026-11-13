import "dotenv/config";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL must point to a separate disposable PostgreSQL database.",
  );
}

if (!new URL(testDatabaseUrl).pathname.endsWith("_test")) {
  throw new Error(
    "TEST_DATABASE_URL must target a database whose name ends with _test.",
  );
}

process.env.DATABASE_URL = testDatabaseUrl;
