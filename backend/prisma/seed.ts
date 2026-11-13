import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';
import { hashPassword } from '../src/auth/passwords.js';

loadEnv({ path: resolve(import.meta.dirname, '../../.env') });

if (process.env.NODE_ENV === 'production') {
  throw new Error('The demo seed is disabled in production.');
}

const seedEnvironment = z
  .object({
    DEMO_USER_ONE_PASSWORD: z.string().min(12).max(128),
    DEMO_USER_TWO_PASSWORD: z.string().min(12).max(128),
    DEMO_ADMIN_PASSWORD: z.string().min(12).max(128),
  })
  .parse(process.env);

const demoAccounts = [
  {
    name: 'Alex Morgan',
    email: 'alex@featurevote.local',
    password: seedEnvironment.DEMO_USER_ONE_PASSWORD,
    role: 'USER' as const,
  },
  {
    name: 'Jordan Lee',
    email: 'jordan@featurevote.local',
    password: seedEnvironment.DEMO_USER_TWO_PASSWORD,
    role: 'USER' as const,
  },
  {
    name: 'Taylor Kim',
    email: 'taylor@featurevote.local',
    password: seedEnvironment.DEMO_ADMIN_PASSWORD,
    role: 'ADMIN' as const,
  },
];

async function seed(): Promise<void> {
  const { prisma, disconnectDatabase } = await import('../src/db/prisma.js');
  try {
    const passwordHashes = await Promise.all(
      demoAccounts.map(({ password }) => hashPassword(password)),
    );
    await prisma.$transaction(
      demoAccounts.map((account, index) => {
        const passwordHash = passwordHashes[index];
        if (!passwordHash) throw new Error('Demo password hash was not created.');
        return prisma.user.upsert({
          where: { email: account.email },
          update: {
            name: account.name,
            passwordHash,
            role: account.role,
          },
          create: {
            name: account.name,
            email: account.email,
            passwordHash,
            role: account.role,
          },
        });
      }),
    );
  } finally {
    await disconnectDatabase();
  }
}

await seed();
