# CareDesk Git workflow

1. Create a focused branch from `main`, such as `feature/appointment-reports`.
2. Make small commits with clear messages.
3. Run `npm test` and `npm run build` before pushing.
4. Open a pull request into `main` and review the automated GitHub Actions checks.
5. Merge only after the tests and production build pass.

Secrets, `.env`, databases, logs, patient data, and `node_modules` must never be committed.
