import express from 'express';
import { createAuthRouter } from './auth/auth-routes.js';
import { sessionMiddleware } from './auth/session-store.js';
import { config } from './config.js';
import { errorHandler, HttpError } from './http/errors.js';

export function createApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');
  if (config.NODE_ENV === 'production') app.set('trust proxy', 1);

  app.use((_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (config.NODE_ENV === 'production') {
      response.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
    }
    next();
  });
  app.use(express.json({ limit: '16kb' }));
  app.use(sessionMiddleware);

  app.get('/api/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });
  app.use('/api/auth', createAuthRouter());
  app.use('/api', (_request, _response, next) => {
    next(new HttpError(404, 'NOT_FOUND', 'API endpoint not found.'));
  });
  app.use(errorHandler);

  return app;
}
