import "dotenv/config";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL must point to a dedicated PostgreSQL test database.",
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

process.env.DATABASE_URL = testDatabaseUrl;
