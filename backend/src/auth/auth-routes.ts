import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { config } from '../config.js';
import { HttpError } from '../http/errors.js';
import { assertSameOrigin } from '../http/same-origin.js';
import { authenticateUser, getUserById, registerUser } from './auth-service.js';
import { SESSION_COOKIE_NAME, SESSION_TTL_MS } from './session-store.js';
import { loginSchema, registerSchema, toFieldErrors } from './validation.js';

function createAuthLimiter(): RequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_request, response) => {
      response.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many attempts. Try again in 15 minutes.',
        },
      });
    },
  });
}

export function createAuthRouter(): Router {
  const router = Router();
  const registrationLimiter = createAuthLimiter();
  const loginLimiter = createAuthLimiter();

  router.post(
    '/register',
    assertSameOrigin,
    registrationLimiter,
    async (request, response) => {
      const parsed = registerSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'Check the highlighted fields and try again.',
          toFieldErrors(parsed.error.issues),
        );
      }

      const user = await registerUser(parsed.data);
      await beginAuthenticatedSession(request, user.id);
      console.info('auth.registration.succeeded', { userId: user.id });
      response.status(201).json({ user });
    },
  );

  router.post('/login', assertSameOrigin, loginLimiter, async (request, response) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'Check the highlighted fields and try again.',
        toFieldErrors(parsed.error.issues),
      );
    }

    const user = await authenticateUser(parsed.data);
    if (!user) {
      console.warn('auth.login.failed');
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    await beginAuthenticatedSession(request, user.id);
    console.info('auth.login.succeeded', { userId: user.id });
    response.status(200).json({ user });
  });

  router.post('/logout', assertSameOrigin, async (request, response, next) => {
    request.session.destroy((error) => {
      if (error) {
        next(error);
        return;
      }

      response.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.NODE_ENV === 'production',
        path: '/',
      });
      response.status(204).end();
    });
  });

  router.get('/me', async (request, response, next) => {
    const userId = request.session.userId;
    if (!userId) {
      next(new HttpError(401, 'UNAUTHORIZED', 'Authentication is required.'));
      return;
    }

    const user = await getUserById(userId);
    if (!user) {
      request.session.destroy((error) => {
        if (error) {
          next(error);
          return;
        }
        next(new HttpError(401, 'UNAUTHORIZED', 'Authentication is required.'));
      });
      return;
    }

    response.status(200).json(user);
  });

  return router;
}

function beginAuthenticatedSession(
  request: Parameters<import('express').RequestHandler>[0],
  userId: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.regenerate((regenerationError) => {
      if (regenerationError) {
        reject(regenerationError);
        return;
      }

      request.session.userId = userId;
      request.session.cookie.maxAge = SESSION_TTL_MS;
      request.session.save((saveError) => {
        if (saveError) {
          reject(saveError);
          return;
        }
        resolve();
      });
    });
  });
}
