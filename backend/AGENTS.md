# Backend (NestJS + Prisma)

## Layout

- `src/<module>/` — controller, service, DTOs, module file
- `src/common/` — guards (`JwtAuthGuard`, `RolesGuard`), filters, interceptors, validation pipe, shared enums
- `prisma/schema.prisma` — source of truth for models; run migrations after schema edits
- `test/app.e2e-spec.ts` — behavioral contract (credits, concurrency, auth, envelope)

## Patterns

- Mark public routes with `@Public()` (register/login). Everything else uses JWT.
- Admin routes: `@Roles(Role.ADMIN)` on handlers or controllers.
- Return plain DTOs from handlers; `ApiResponseInterceptor` wraps `{ message, data }`. Set message with `@ResponseMessage('…')` when not default `OK`.
- Validation: class-validator on DTOs; global whitelist pipe strips unknown fields.
- **Credits:** never update `credit_accounts.balance` without a ledger row in the same transaction—use `applyLedger` in `credits/ledger.ts`.
- **Attempts:** stake on start; score and settle on submit; use row locks and status guards documented in README.

## Commands

```bash
npm run start:dev      # watch mode, port 3001
npm test               # e2e suite
npm run db:seed
npm run db:embedded    # local Postgres without Docker
npx prisma studio
```

## Swagger

When running: http://localhost:3001/docs. OpenAPI JSON at `/docs-json` (DigitalAPI import).

## Tests

Add or extend e2e tests for any change to credit settlement, idempotency, roles, or response shape. Run `npm test` before finishing backend tasks.
