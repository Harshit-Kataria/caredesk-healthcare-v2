# CareDesk — Doctor Appointment & Patient Management System

> Version 2 adds a React client, Express middleware API, JWT authentication, realtime WebSockets, scheduled maintenance, Redis-compatible caching, sandbox payments, optional MongoDB and PostgreSQL/Prisma integrations, Docker, and a safe administrative AI assistant.

A full-stack college capstone project for a small medical practice. Staff can sign in, manage patient and doctor records, schedule appointments, and track visit status through a responsive dashboard.

## Features

- Account creation and sign-in with salted PBKDF2 password hashes and expiring server-side sessions
- Private workspace for each account, with server-side record ownership checks
- Patient and doctor directories with search, editing, and deletion safeguards
- Appointment scheduling with 15–90 minute durations and server-side overlap checks for both doctors and patients
- Appointment status tracking: scheduled, completed, cancelled, and no-show
- Dashboard showing today's schedule and practice totals
- SQLite persistence, REST API, responsive interface, and zero third-party runtime dependencies

## Run locally

Install **Node.js 22.13 or newer**, then from this folder run:

```text
npm install
npm run dev
```

Open **http://localhost:5173** for development. For a production-style run use `npm run build`, then `npm start`, and open **http://localhost:3000**.

Open **http://localhost:3000**. The demo login is **admin@caredesk.local** / **Admin@123**. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before the first run to choose different credentials. The account is created only when the database has no users.

The `seed` command adds fictional sample records only if both directories are empty. You can skip it and create your own records through the interface.

Data is stored in `data/caredesk.sqlite`. Back up this file to preserve your records. Keep this database file private when sharing the project.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/login` | Sign in |
| POST | `/api/signup` | Create a private account |
| POST | `/api/logout` | End session |
| GET | `/api/me` | Current user |
| GET, POST | `/api/doctors`, `/api/patients`, `/api/appointments` | List or create |
| PUT, DELETE | `/api/{resource}/{id}` | Update or delete |

All record endpoints require `Authorization: Bearer <token>`. Each account can access only its own records. API input is validated on the server. Linked patients and doctors cannot be removed while appointments reference them.

## Rubric feature map

| Concept | Working implementation |
| --- | --- |
| React | `src/main.jsx`: `useState`, `useEffect`, React Router, controlled validated forms, loading/error states, `Promise.all`. |
| REST/backend | Express middleware, Zod request validation, CRUD routes, correct status codes, owner authorization. |
| MongoDB | `src/integrations/mongoRepository.js`: document CRUD, owner references, aggregation, compound indexes. |
| PostgreSQL/Prisma | `prisma/schema.prisma` normalized relations/indexes; transactional appointment method in `prismaRepository.js`. |
| Security | bcrypt (cost 12), signed/expiring JWTs, token revocation store, rate-limited auth, prepared SQL. |
| AI engineering | `src/services/ai.js`: scoped prompt behavior, structured Zod output, streaming, tool calls, retrieval, evals, injection/medical safety guard, token/cost counters, multi-step agent trace. |
| Docker | Multi-stage `Dockerfile` and Compose services for app, Redis, MongoDB, and PostgreSQL. |
| Redis | Real Redis adapter when configured; expiring in-memory fallback locally. |
| Realtime | Authenticated WebSocket endpoint broadcasts owner-scoped CRUD events. |
| Scheduled jobs | Daily expired-session cleanup through `node-cron`. |
| SSR | `/about` is rendered server-side with ReactDOM Server. |
| Payments | Offline test intents plus an optional Stripe test-API adapter; live mode and live keys are rejected. |
| Deployment | Vite production build, static serving, health endpoint, environment template, persistent Docker volume. |
| Client-side routing | `src/routes.jsx` declares every React Router path; `src/main.jsx` links to those routes. |
| Event loop, callbacks, Promises, closures, hoisting | `src/concepts/javascriptConcepts.js` contains executable examples covered by `test/concepts.test.js`. |
| Embedding vs references | `src/models/mongoAppointment.model.js` defines Mongoose references and embedded subdocuments. `src/repositories/mongooseAppointmentRepository.js` writes both forms and resolves references with `populate()`. |
| Function calling/tool use | `src/services/toolRegistry.js` publishes a JSON function schema and safely dispatches registered tools. |
| SQL JOINs | `src/repositories/appointmentReport.js` joins appointments, doctors, and patients; `/api/reports/appointments` executes it. |
| Git workflow | `.github/workflows/ci.yml` validates tests and builds on pushes and pull requests; `CONTRIBUTING.md` documents the branch workflow. |
| JavaScript hoisting | `public/hoisting.js` is loaded before React and demonstrates function declaration hoisting, `var` declaration hoisting, and the `let` temporal dead zone. `test/hoisting.test.js` executes and verifies every result. |

### Git workflow evidence

This project uses `main` as the protected integration branch. Work is developed
on focused `codex/*` feature branches, validated by the CI workflow, and merged
back with a merge commit so the branch history remains visible.

## Architecture

The primary browser UI is React with client-side routing. An Express server handles JWT authentication, REST APIs, WebSockets, SSR, AI, payments, caching, and scheduled work. SQLite is the zero-configuration default. MongoDB and normalized PostgreSQL/Prisma implementations are included behind opt-in integration modules. See [setup and deployment](docs/SETUP_AND_DEPLOYMENT.md), [HLD](HLD.md), and [LLD](LLD.md).

## Tests

Run `npm test` for authentication, CRUD, appointment conflicts, tenant isolation, AI retrieval/safety/streaming/tool calls, and sandbox payment behavior. Tests use temporary storage and do not touch application records.

## Capstone scope

This is a local demonstration project with fictional data. Before use in a real clinic, add role-based permissions, audit logs, encrypted backups, stronger account management, HTTPS deployment, and applicable privacy controls.

## Resume description

**CareDesk — Doctor Appointment & Patient Management System**  
Built a full-stack scheduling application with Node.js, SQLite, and vanilla JavaScript. Implemented authenticated REST APIs, patient and doctor CRUD, appointment status tracking, relational data integrity, and overlap prevention for both clinician and patient schedules. Added a responsive dashboard and automated API tests.
