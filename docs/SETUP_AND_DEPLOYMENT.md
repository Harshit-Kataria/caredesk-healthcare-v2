# Setup and Deployment

## Local development

1. Copy `.env.example` to `.env` and replace `JWT_SECRET` and the bootstrap password.
2. Run `npm install`.
3. Run `npm run dev` for the React Vite server and API together.
4. Open `http://localhost:5173`.

For a production-style local run, use `npm run build` followed by `npm start`, then open the configured API port (3000 by default).

## Optional infrastructure

The default datastore is SQLite and the default cache is in memory, so the project runs without external services. The repository also contains working integration modules for:

- MongoDB document CRUD, references through IDs, compound indexes, and an aggregation-based dashboard.
- PostgreSQL through Prisma with normalized relations, indexes, and a transaction that validates doctor/patient ownership before creating an appointment.
- Redis JSON caching when `REDIS_URL` is set.

Run `docker compose up --build` to start the app, Redis, MongoDB, and PostgreSQL. SQLite remains the active application repository until `DATABASE_BACKEND` is wired to a selected external adapter; the integration modules can be exercised independently. This deliberate feature boundary prevents an unavailable service from breaking the local demonstration.

## Database workflows

- SQLite: no migration command is required; the server performs idempotent startup migrations.
- Prisma/PostgreSQL: set `DATABASE_URL`, run `npm run prisma:generate`, then `npm run prisma:migrate`.
- MongoDB: set `MONGODB_URI` and `MONGODB_DATABASE`; `createMongoRepository()` creates its indexes on connection.

## Production checklist

- Build with `npm run build` and run `node server.js` on Node.js 22.13+.
- Set a long random `JWT_SECRET`; never use the documented development fallback.
- Set non-default bootstrap credentials before first startup.
- Terminate TLS at the hosting platform and provide persistent storage for `DATA_DIR`.
- Use managed Redis/PostgreSQL/MongoDB only over authenticated encrypted connections.
- Keep `PAYMENT_MODE=sandbox`; the repository intentionally rejects live payment mode. `PAYMENT_PROVIDER=mock` is fully offline. Set `PAYMENT_PROVIDER=stripe` with an `sk_test_...` key to use Stripe's test API; live keys are rejected before any request.
- Add the provider-specific AI adapter only after privacy, retention, and data-processing review. Never send clinical notes or direct identifiers to an external model.
- Configure backups, audit retention, monitoring, and healthcare compliance controls before any real patient use.

## Deployment readiness

`Dockerfile`, health endpoint `/health`, environment configuration, static React build, and persistent data volume make the application deployable to a container host. No public deployment is claimed by this repository; deployment must be verified on the selected provider.
