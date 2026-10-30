# QuizCred — agent instructions

This repo uses a **self-improving AI context harness** (see `.cursor/CONTEXT-HARNESS.md`). Read this file first; use nested `AGENTS.md` when working only in `backend/` or `frontend/`.

## Product in one sentence

Players stake credits to take published quizzes; the API scores attempts and settles credits via an append-only ledger. Admins manage quizzes and questions. The web app is a thin client.

## Commands

| Goal | Command |
|------|---------|
| Full stack (Docker) | `docker compose up --build` → web :3000, API :3001, Swagger `/docs` |
| API dev | `cd backend` → `npm run start:dev` (after migrate + seed) |
| Web dev | `cd frontend` → `npm run dev` |
| API tests | `cd backend` → `npm test` (embedded Postgres + e2e) |
| Migrations | `cd backend` → `npx prisma migrate deploy` |
| Seed | `cd backend` → `npm run db:seed` |

Seed users: `admin@quiz.com` / `Admin123!`, `user@quiz.com` / `User123!`.

## Architecture

```text
Next.js (frontend/)  --Bearer JWT-->  NestJS (backend/)  --Prisma-->  PostgreSQL
```

- **Never** compute quiz scores or credit balances in the browser.
- **Credits:** all movements through `backend/src/credits/ledger.ts` inside transactions; see README “How balances stay consistent”.
- **Auth:** JWT in `localStorage` (`frontend/lib/session.ts`); global `JwtAuthGuard` + `@Roles` on the API.
- **HTTP:** successes `{ message, data }` via `ApiResponseInterceptor`; errors `{ statusCode, code, message }` unwrapped. Frontend unwraps in `frontend/lib/api.ts`.

## Where to look (canonical files)

| Topic | File |
|-------|------|
| API client + error codes | `frontend/lib/api.ts` |
| Route protection (web) | `frontend/components/auth-gate.tsx` |
| Response envelope | `backend/src/common/interceptors/api-response.interceptor.ts` |
| Ledger / idempotency | `backend/src/credits/ledger.ts` |
| Attempt stake + submit | `backend/src/attempts/attempts.service.ts` |
| E2e invariants | `backend/test/app.e2e-spec.ts` |
| Human runbook | `README.md` |

## Conventions

- Match existing module layout: Nest feature folders under `backend/src/<domain>/`; Next routes under `frontend/app/`.
- Prefer extending DTOs, guards, and `api()` over new fetch wrappers.
- After API shape changes, update Swagger (controllers) and any `frontend/lib/types.ts` usage.
- Do not commit secrets, `.env`, `node_modules`, `.next`, `backend/dist`, or `backend/.pgdata`.

## When you learn something new

If you hit a non-obvious repo fact or fix a mistake that could repeat:

1. Append a dated bullet to `.cursor/context/LEARNINGS.md`.
2. If it affects daily work, add a short rule in `.cursor/rules/` or a line in the relevant `AGENTS.md`.
3. Mention the harness update in your summary to the user.

Do not paste large code blocks into rules—reference paths with `@file` instead.
