# Frontend (Next.js App Router)

## Layout

- `app/` — file-based routes (`login`, `quizzes`, `attempts`, `wallet`, `leaderboard`, `admin/quizzes`, `profile`)
- `components/` — `Shell`, `AuthGate`, shared UI
- `lib/` — `api.ts` (all HTTP), `session.ts` (JWT + user in localStorage), `types.ts`

## Patterns

- **Client components:** pages that touch auth or browser APIs use `'use client'` and wrap content in `<AuthGate>` where needed.
- **AuthGate:** `admin` → ADMIN only; `player` → redirects ADMIN to `/admin/quizzes`; unauthenticated → `/login`.
- **Data fetching:** use `api<T>(path, init)` from `@/lib/api`—it attaches Bearer token, unwraps `data`, maps errors to `ApiError`, clears session on 401.
- **Env:** `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`). No server-side secrets in the web app.
- **Styling:** Tailwind; follow existing page structure (Shell, cards, balance chip patterns on quiz flows).

## Do not

- Calculate scores, pass/fail, or balances locally except for display of API-returned values.
- Add raw `fetch` to the API except inside `lib/api.ts`.
- Store tokens outside `session.ts` helpers.

## Commands

```bash
npm run dev    # :3000
npm run build
npm run lint
```

## Checklist for UI changes

- Error messages: use `apiErrorMessage()` from `@/lib/api`.
- Admin vs player: confirm `AuthGate` props match the route.
- After new API fields, update `@/lib/types` and consuming pages.
