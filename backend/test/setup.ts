import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: resolve(import.meta.dirname, '../../.env') });

const testDatabaseUrl = process.env.DATABASE_URL_TEST;
if (!testDatabaseUrl) {
  throw new Error(
    'Set DATABASE_URL_TEST to a dedicated test database before running tests.',
  );
}

const databaseName = new URL(testDatabaseUrl).pathname.slice(1);
if (!databaseName.toLowerCase().endsWith('_test')) {
  throw new Error(
    'DATABASE_URL_TEST must point to a database whose name ends in "_test".',
  );
}

const developmentDatabaseUrl = process.env.DATABASE_URL;
if (developmentDatabaseUrl) {
  const developmentUrl = new URL(developmentDatabaseUrl);
  const testUrl = new URL(testDatabaseUrl);
  if (
    developmentUrl.host === testUrl.host &&
    developmentUrl.pathname === testUrl.pathname
  ) {
    throw new Error('DATABASE_URL_TEST must not match DATABASE_URL.');
  }
}

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = testDatabaseUrl;
process.env.SESSION_SECRET ??= 'featurevote-test-session-secret-at-least-32-chars';
process.env.APP_ORIGIN ??= 'http://localhost:5173';
