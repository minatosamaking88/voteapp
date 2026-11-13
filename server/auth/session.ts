import { createHash, randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import type { Prisma } from "../../generated/prisma/client.js";
import { config } from "../config.js";
import { prisma } from "../db/prisma.js";

const SESSION_TTL_DAYS = 14;

export const sessionCookieName = config.secureCookies
  ? "__Host-feature-board-session"
  : "feature-board-session";

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  transaction: Prisma.TransactionClient,
  userId: string,
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await transaction.session.deleteMany({ where: { expiresAt: { lte: now } } });
  await transaction.session.create({
    data: { tokenHash: hashSessionToken(token), userId, expiresAt },
  });

  return token;
}

export function setSessionCookie(response: Response, token: string): void {
  response.cookie(sessionCookieName, token, {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(response: Response): void {
  response.clearCookie(sessionCookieName, {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "lax",
    path: "/",
  });
}

export function getSessionToken(request: Request): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;

  for (const cookie of cookieHeader.split(";")) {
    const separator = cookie.indexOf("=");
    if (
      separator < 0 ||
      cookie.slice(0, separator).trim() !== sessionCookieName
    )
      continue;

    try {
      return decodeURIComponent(cookie.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export async function loadSessionUser(token: string) {
  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  });

  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.session.deleteMany({ where: { tokenHash } });
    return null;
  }

  return { session, user: session.user };
}
