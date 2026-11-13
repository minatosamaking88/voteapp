import bcrypt from "bcryptjs";
import type { PublicUser } from "../../shared/contracts.js";
import { prisma } from "../db/prisma.js";
import { HttpError } from "../http/errors.js";
import { createSession } from "./session.js";

const PASSWORD_COST = 12;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  "not-a-valid-account-password",
  PASSWORD_COST,
);

function publicUser(user: {
  id: string;
  email: string;
  name: string;
  role: PublicUser["role"];
}): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function registerAccount(input: {
  email: string;
  name: string;
  password: string;
}): Promise<{ user: PublicUser; token: string }> {
  const passwordHash = await bcrypt.hash(input.password, PASSWORD_COST);
  try {
    return await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash,
        },
      });
      const token = await createSession(transaction, user.id);
      return { user: publicUser(user), token };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new HttpError(
        409,
        "EMAIL_IN_USE",
        "An account with this email already exists.",
      );
    }
    throw error;
  }
}

export async function authenticateAccount(input: {
  email: string;
  password: string;
}): Promise<{ user: PublicUser; token: string }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const passwordMatches = await bcrypt.compare(input.password, passwordHash);

  if (!user || !passwordMatches) {
    throw new HttpError(
      401,
      "INVALID_CREDENTIALS",
      "Email or password is incorrect.",
    );
  }

  const token = await prisma.$transaction((transaction) =>
    createSession(transaction, user.id),
  );
  return { user: publicUser(user), token };
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "P2002";
}

export async function revokeSession(tokenHash: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash } });
}
