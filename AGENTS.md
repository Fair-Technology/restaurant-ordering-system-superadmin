# rs-superadmin — agent notes

Platform-staff console (React + TypeScript + Vite) of the restaurant ordering system.

**How to run it locally is in [README.md → Running locally](README.md#running-locally). Read that rather than duplicating it here.** The facts agents most often get wrong:

- Port **5174**: `npm run dev -- --port 5174 --strictPort`. Use `localhost`, never `127.0.0.1` (Vite binds IPv6 only).
- Start `rs-backend` first (`http://localhost:7071/api`). Its CORS allow-list is 5173–5176 only.
- `VITE_API_BASE_URL` must end in `/api`; this app does not append it.
- Sign-in is the Microsoft **workforce** tenant (`VITE_MSAL_AUTHORITY`). It can't be automated; e2e tests use a captured session (`rs-e2e`, `npm run auth:superadmin`).
- The API client (`src/services/api.ts`) is hand-maintained; there is no codegen script here.
- Pushing to `main` deploys to the dev Static Web App. Work on a branch and open a PR.
- Product rules live in the shared spec in `rs-backend` (`docs/spec.md`), not in this repo.
