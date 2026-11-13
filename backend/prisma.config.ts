import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

loadEnv({ path: resolve(import.meta.dirname, '../.env') });

function getTestDatabaseUrl(): string {
  const testDatabaseUrl = env('DATABASE_URL_TEST');
  const testUrl = new URL(testDatabaseUrl);
  const databaseName = testUrl.pathname.slice(1);

  if (!databaseName.endsWith('_test')) {
    throw new Error('DATABASE_URL_TEST must target a database ending in "_test".');
  }

  const developmentDatabaseUrl = process.env.DATABASE_URL;
  if (developmentDatabaseUrl) {
    const developmentUrl = new URL(developmentDatabaseUrl);
    if (
      developmentUrl.host === testUrl.host &&
      developmentUrl.pathname === testUrl.pathname
    ) {
      throw new Error('DATABASE_URL_TEST must not match DATABASE_URL.');
    }
  }

  return testDatabaseUrl;
}

const datasourceUrl =
  process.env.NODE_ENV === 'test'
    ? getTestDatabaseUrl()
    : (process.env.DATABASE_URL ??
      'postgresql://featurevote:local@localhost:5432/featurevote?sslmode=disable');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: { url: datasourceUrl },
});
