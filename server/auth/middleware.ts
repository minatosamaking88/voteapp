import type { Request, RequestHandler } from "express";
import type { PublicUser } from "../../shared/contracts.js";
import {
  clearSessionCookie,
  getSessionToken,
  loadSessionUser,
} from "./session.js";
import { HttpError, sendApiError } from "../http/errors.js";

export const requireAuth: RequestHandler = async (request, response, next) => {
  const token = getSessionToken(request);
  if (!token) {
    sendApiError(response, 401, "UNAUTHENTICATED", "Sign in to continue.");
    return;
  }

  const session = await loadSessionUser(token);
  if (!session) {
    clearSessionCookie(response);
    sendApiError(
      response,
      401,
      "UNAUTHENTICATED",
      "Your session has expired. Sign in again.",
    );
    return;
  }

  request.user = session.user;
  next();
};

export function getAuthenticatedUser(request: Request): PublicUser {
  if (!request.user) {
    throw new HttpError(401, "UNAUTHENTICATED", "Sign in to continue.");
  }
  return request.user;
}

export const requireAdmin: RequestHandler = (request, response, next) => {
  if (!request.user) {
    sendApiError(response, 401, "UNAUTHENTICATED", "Sign in to continue.");
    return;
  }

  if (request.user.role !== "ADMIN") {
    sendApiError(
      response,
      403,
      "FORBIDDEN",
      "Administrator access is required.",
    );
    return;
  }

  next();
};
