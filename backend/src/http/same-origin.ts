import type { RequestHandler } from 'express';
import { config } from '../config.js';
import { HttpError } from './errors.js';

export const assertSameOrigin: RequestHandler = (request, _response, next) => {
  const origin = request.get('origin');
  const fetchSite = request.get('sec-fetch-site');

  if (
    !origin ||
    origin !== config.APP_ORIGIN ||
    (fetchSite && fetchSite !== 'same-origin')
  ) {
    next(new HttpError(403, 'CROSS_ORIGIN_REQUEST', 'Cross-origin request blocked.'));
    return;
  }

  next();
};
