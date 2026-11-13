# Feature Board

A shared request board where users submit ideas and vote, and administrators communicate progress as Planned, In Progress, or Shipped.

## Design

The interface uses the B2B app palette with a clean mood: Inter typography, 8px controls, comfortable spacing, and clear status colors for Planned, In Progress, and Shipped.

## Requirements

- Node.js 26 LTS is recommended; 22.12+ is the minimum compatible with the Vite 8 toolchain. npm.
- PostgreSQL 16 or later.
- A local PostgreSQL service for development, plus a separate disposable database for integration tests.

## Installation and environment

1. Copy `.env.example` to `.env` and replace the database and demo password placeholders with values for your machine. Keep `.env` private; it is ignored by Git.
2. Set `DATABASE_URL` to your application database and `TEST_DATABASE_URL` to a separate database whose name ends in `_test`. Local URLs use `sslmode=disable`; set `WEB_ORIGIN` to the exact browser origin and `PORT` to the Express API port (default `4000`).
3. Set distinct demo emails and strong passwords for `DEMO_ADMIN_*`, `DEMO_USER_A_*`, and `DEMO_USER_B_*`. Demo passwords must be at least 12 characters.
4. Start PostgreSQL with your platform's service manager. For example, on systemd Linux run `sudo systemctl start postgresql`; on macOS with Homebrew run `brew services start postgresql`.
5. Create the app and test databases using a PostgreSQL role matching `DATABASE_URL` and `TEST_DATABASE_URL`:

   ```sh
   createdb feature_board
   createdb feature_board_test
   ```

   If your PostgreSQL setup uses another database user, pass it to `createdb` with `-U` and make the URLs match.

6. Install the locked dependencies and generate the Prisma client:

   ```sh
   npm ci
   npm run db:generate
   ```

## Migrations and demo data

Apply development migrations and seed the demo Admin, two Users, feature requests, and votes:

```sh
npm run db:migrate:dev
npm run db:seed
```

The seed uses the credentials configured in `.env`; it does not print passwords. The seeded Admin and regular Users can sign in on the board. Registration always creates a regular User; only the seed grants the Admin role.

For production, use `npm run db:migrate:deploy` to apply committed migrations. Do not use `migrate dev` against production data.

## Development

```sh
npm run dev
```

This starts the Express API on `PORT` and Vite on port `5173`; Vite proxies `/api` to the API. Visit `http://localhost:5173`. Admins see the Admin navigation link and may also submit requests and vote from the shared board.

## Testing

```sh
npm test
npm run test:ui
```

The integration runner verifies that the test database is separate from the application database and ends in `_test`, applies migrations, then runs the complete API, production-routing, and React component suite. `npm run test:ui` runs the isolated Admin status-row component tests without PostgreSQL. Tests clear their tables, so never point `TEST_DATABASE_URL` at a database containing data you need. Coverage includes Admin/User and anonymous authorization, supported and invalid status changes, missing IDs, all-board summary counts, preserved author/date/votes, the submit → vote → status → reload workflow, production deep links, and JSON errors for unknown API paths.

## Production build and start

Set `NODE_ENV=production`, `PORT`, `WEB_ORIGIN` (the HTTPS site origin), `DATABASE_URL`, and `TRUST_PROXY_HOPS` in the hosting environment. Leave `TRUST_PROXY_HOPS=0` for direct traffic; set it to the number of trusted reverse-proxy hops used by the host (often `1`) so secure client-IP handling and login rate limits work correctly. Apply migrations and build/start the app:

```sh
npm run db:migrate:deploy
npm run build
npm start
```

Express serves the built Vite frontend and API from the same origin. Frontend deep links such as `/admin` return the app entry page; unknown `/api` routes remain JSON 404 responses. Production session cookies use the `Secure`, `HttpOnly`, `SameSite=Lax`, and `__Host-` protections; terminate HTTPS at the host or trusted reverse proxy.

## Main routes

- `/` — sign in, submit feature requests, and vote.
- `/admin` — Admin-only summary counts and status management.
- `/api/features` — shared paginated, searchable, filterable, sortable feature list.
- `/api/admin/summary` and `/api/admin/features/:id/status` — protected Admin APIs.
