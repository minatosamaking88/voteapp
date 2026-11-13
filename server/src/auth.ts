import { createHash, randomBytes } from "node:crypto";
import type { RequestHandler } from "express";
import { ApiError } from "./api-error.js";
import { prisma } from "./db.js";

export const SESSION_COOKIE_NAME = "featurevote_session";
const SESSION_LIFETIME_MS = 14 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    expires,
  };
}

export async function createSession(
  userId: string,
  response: Parameters<RequestHandler>[1],
) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS);
  const token = randomBytes(32).toString("base64url");

  await prisma.session.deleteMany({ where: { expiresAt: { lt: now } } });
  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });
  response.cookie(SESSION_COOKIE_NAME, token, cookieOptions(expiresAt));
}

export const requireAuthentication: RequestHandler = async (
  _request,
  response,
  next,
) => {
  const token = _request.cookies?.[SESSION_COOKIE_NAME];
  if (typeof token !== "string" || token.length < 32) {
    throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
  }

  response.locals.authenticatedUser = session.user;
  next();
};

export const assertSameOrigin: RequestHandler = (request, _response, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    next();
    return;
  }

  const fetchSite = request.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    throw new ApiError(
      403,
      "CROSS_SITE_REQUEST",
      "Cross-site requests are not allowed.",
    );
  }

  const origin = request.get("origin");
  const host = request.get("host");
  if (origin) {
    try {
      if (new URL(origin).host !== host) {
        throw new ApiError(
          403,
          "CROSS_SITE_REQUEST",
          "Cross-site requests are not allowed.",
        );
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        403,
        "CROSS_SITE_REQUEST",
        "Cross-site requests are not allowed.",
      );
    }
  }

  next();
};
