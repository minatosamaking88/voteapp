import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { loginSchema, registerSchema } from "../../shared/contracts.js";
import { sendApiError, sendValidationError } from "../http/errors.js";
import {
  authenticateAccount,
  registerAccount,
  revokeSession,
} from "./service.js";
import { requireAuth } from "./middleware.js";
import {
  clearSessionCookie,
  getSessionToken,
  hashSessionToken,
  setSessionCookie,
} from "./session.js";

export const authRouter = Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_request, response) => {
    sendApiError(
      response,
      429,
      "RATE_LIMITED",
      "Too many attempts. Wait 15 minutes and try again.",
    );
  },
});

authRouter.post("/register", authRateLimit, async (request, response, next) => {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    sendValidationError(response, parsed.error);
    return;
  }

  try {
    const account = await registerAccount(parsed.data);
    setSessionCookie(response, account.token);
    response.status(201).json({ user: account.user });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", authRateLimit, async (request, response, next) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    sendValidationError(response, parsed.error);
    return;
  }

  try {
    const account = await authenticateAccount(parsed.data);
    setSessionCookie(response, account.token);
    response.json({ user: account.user });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, (request, response) => {
  response.json({ user: request.user });
});

authRouter.post("/logout", requireAuth, async (request, response, next) => {
  try {
    const token = getSessionToken(request);
    if (token) await revokeSession(hashSessionToken(token));
    clearSessionCookie(response);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});
