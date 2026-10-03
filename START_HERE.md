# Start Here

This package contains the complete CareDesk healthcare appointment administration project.

## 1. Extract and open

1. Extract the ZIP into a new folder.
2. Open that extracted folder in VS Code using **File → Open Folder**.
3. Open the VS Code terminal in that folder.

## 2. Install and run

```text
npm install
npm run build
npm start
```

Open `http://localhost:3000`.

For active frontend development, use `npm run dev` and open `http://localhost:5173`.

## 3. Environment configuration

Copy `.env.example` to `.env`. At minimum, replace `JWT_SECRET` and `ADMIN_PASSWORD` before sharing or deploying the application. Never commit `.env` or the `data` directory.

## 4. Verify

```text
npm test
```

The automated suite covers authentication, private account isolation, CRUD, schedule conflicts, AI retrieval/safety/streaming/tool calls, and sandbox payments.

## 5. Upload to GitHub

Create an empty GitHub repository, then run:

```text
git init
git add .
git commit -m "Initial CareDesk healthcare project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Confirm that `.env`, `data`, `node_modules`, and local database files do not appear on GitHub.

## 6. Deploy

The included `render.yaml` describes a Node web service with a persistent disk. On Render, create a Blueprint from the GitHub repository and enter secure values for the environment variables marked `sync: false`.

Deployment commands:

- Build: `npm ci && npm run build`
- Start: `npm start`
- Health check: `/health`

The application uses SQLite by default, so persistent disk storage at `/var/data` is required. See `docs/SETUP_AND_DEPLOYMENT.md` for Docker, Redis, MongoDB, PostgreSQL/Prisma, Stripe sandbox, and production security details.

