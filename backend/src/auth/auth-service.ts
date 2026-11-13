import { prisma } from '../db/prisma.js';
import { HttpError } from '../http/errors.js';
import type { LoginInput, RegisterInput } from './validation.js';
import { dummyPasswordHash, hashPassword, verifyPassword } from './passwords.js';

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
};

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

export async function registerUser(input: RegisterInput): Promise<PublicUser> {
  const passwordHash = await hashPassword(input.password);

  try {
    return await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
      select: publicUserSelect,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError(
        409,
        'EMAIL_ALREADY_EXISTS',
        'An account with this email already exists.',
      );
    }
    throw error;
  }
}

export async function authenticateUser(input: LoginInput): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...publicUserSelect, passwordHash: true },
  });
  const passwordHash = user?.passwordHash ?? (await dummyPasswordHash);
  const passwordIsValid = await verifyPassword(passwordHash, input.password);

  if (!user || !passwordIsValid) return null;

  const { id, name, email, role } = user;
  return { id, name, email, role };
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}
