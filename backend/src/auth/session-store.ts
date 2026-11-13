import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from '../db/prisma.js';
import { config } from '../config.js';

export const SESSION_COOKIE_NAME = 'featurevote.sid';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const PgSessionStore = connectPgSimple(session);
export const sessionStore = new PgSessionStore({
  pool,
  tableName: 'session',
  createTableIfMissing: false,
  ttl: SESSION_TTL_MS / 1000,
  pruneSessionInterval: 900,
});

export const sessionMiddleware = session({
  name: SESSION_COOKIE_NAME,
  secret: config.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS,
    path: '/',
  },
});
