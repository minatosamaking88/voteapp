# FeatureVote

FeatureVote is a small feature-request and voting application for one product team. This first delivery provides registration, login, persistent sessions, logout, and a protected feature-board placeholder. Feature requests, voting, and admin workflows are intentionally reserved for later stories.

## Stack

- React, Vite, TypeScript, Tailwind CSS, and React Router
- Express and TypeScript
- PostgreSQL and Prisma ORM
- Argon2id passwords and PostgreSQL-backed `express-session`
- npm workspaces

## Local setup

1. Install Node.js 22 or newer, npm, and Docker Compose.
2. Copy `.env.example` to `.env`. Replace the local database password and `SESSION_SECRET`; set all three demo passwords to values of at least 12 characters.
3. Install dependencies and start PostgreSQL:

   ```sh
   npm install
   docker compose up -d postgres
   ```

4. Apply the development migration and create the demo accounts:

   ```sh
   npm run db:migrate --workspace backend
   npm run db:seed --workspace backend
   ```

5. Start both workspaces:

   ```sh
   npm run dev
   ```

   The Vite app is available at `http://localhost:5173`; the API listens on port `4000` and Vite proxies `/api` requests to it.

The demo seed creates `alex@featurevote.local` and `jordan@featurevote.local` as regular users, and `taylor@featurevote.local` as an admin. Their passwords come only from `DEMO_USER_ONE_PASSWORD`, `DEMO_USER_TWO_PASSWORD`, and `DEMO_ADMIN_PASSWORD` in `.env`. The seed refuses to run when `NODE_ENV=production` and can be run repeatedly in development.

## Database and environment

- `DATABASE_URL` points to the local development PostgreSQL database. Prisma uses the connection string with TLS disabled for local connections.
- `DATABASE_URL_TEST` must point to a separate database whose name ends in `_test`. Tests reject any other database name and reject a URL identical to `DATABASE_URL`.
- `SESSION_SECRET` must be at least 32 characters; use a cryptographically random value for production.
- `APP_ORIGIN` must match the browser app origin. State-changing authentication requests require that exact `Origin`.
- The root `.env.example` configures PostgreSQL Compose, the backend, and demo seed passwords. `frontend/.env.example` documents the Vite API base URL; the `/api` proxy is the default.

To create the test database once, run:

```sh
docker compose exec postgres createdb -U featurevote featurevote_test
```

Then `npm test` applies the committed migrations to `DATABASE_URL_TEST` and runs the API integration suite. The test setup refuses to run unless its database URL contains `test`.

## Commands

```sh
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run db:migrate --workspace backend
npm run db:deploy --workspace backend
npm run db:seed --workspace backend
```

## Authentication API

- `POST /api/auth/register` — create a regular user and start a session
- `POST /api/auth/login` — authenticate and start a rotated session
- `POST /api/auth/logout` — destroy the server-side session and clear its cookie
- `GET /api/auth/me` — return the authenticated user's public profile, or `401`
- `GET /api/health` — return `{ "status": "ok" }`

Passwords are hashed with Argon2id. Session cookies are HttpOnly, SameSite=Lax, secure in production, and expire after seven days. Registration never accepts a role. Do not use the example passwords or session secret in production.
