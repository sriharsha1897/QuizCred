# QuizCred

A quiz API with a credit ledger, and a Next.js client for playing and administering it.

Players register, receive 500 credits, stake credits to enter a published quiz, and submit answers. The server scores the attempt. A pass adds the quiz reward. A fail leaves the stake deducted. Players can read their balance and ledger, and buy credit packs in the app (no external payment gateway in this demo). Admins create quizzes and questions and publish them.

## Stack

- API: NestJS, Prisma, PostgreSQL, JWT
- Web: Next.js App Router
- Docs: Swagger UI at `/docs`, OpenAPI JSON at `/docs-json`
- Local full stack: Docker Compose
- Production target: GCP Cloud Run and Cloud SQL, then DigitalAPI in front of the API
- AI assistants: `AGENTS.md` and `.cursor/CONTEXT-HARNESS.md` (rules, skills, learnings log)

## Layout

Monorepo with two apps and shared ops at the repo root.

```
Quiz application-assignment/
├── backend/                 # NestJS API
│   ├── prisma/              # schema, migrations, seed entry (seed.ts → src/seed)
│   ├── scripts/             # local dev helpers (embedded Postgres)
│   ├── src/
│   │   ├── auth/            # login, register, profile, JWT
│   │   ├── attempts/        # quiz attempts and settlement
│   │   ├── credits/         # ledger, balance, purchase
│   │   ├── quizzes/         # player + admin quiz routes
│   │   ├── questions/       # admin question CRUD
│   │   ├── health/          # GET /health
│   │   ├── leaderboard/     # GET /leaderboard (rankings)
│   │   ├── prisma/          # PrismaService + shared DB types
│   │   ├── seed/            # seed data and runner used by prisma/seed.ts
│   │   └── common/          # guards, filters, DTO responses, validation, enums
│   └── test/                # e2e (Supertest) + test DB harness
├── frontend/                # Next.js App Router
│   ├── app/                 # routes (login, quizzes, wallet, leaderboard, admin, profile, …)
│   ├── components/          # shell, auth gate, theme toggle, shared UI
│   └── lib/                 # API client, session, types, branding
├── docker-compose.yml       # postgres + api + web
└── scripts/deploy-gcp.sh    # Cloud Run deploy
```

Generated or local-only paths (gitignored): `backend/dist`, `backend/.pgdata`, `backend/.test-pg`, `frontend/.next`, `node_modules`, `.env`.

## Credit rules

Credits are integers.

- Register writes a `WELCOME_BONUS` of 500 in the same transaction as the user and the account.
- Starting an attempt writes a negative `STAKE` for `quiz.stake` immediately. The same quiz can be attempted again, and each start stakes again.
- Submit scores on the server. The client never sends a score.
- Pass writes a positive `QUIZ_REWARD` for `quiz.reward`. Net change is `reward - stake`.
- Fail writes nothing further. The stake stays deducted.
- `POST /credits/purchase` accepts a pack id and an idempotency key. Purchase is recorded on the server immediately (demo flow, no card processor). Replaying the same key for the same user returns the original purchase and does not credit twice.

Packs: 200, 500, and 1000 credits.

## Extras (beyond the brief)

- **Leaderboard** — `GET /leaderboard` ranks players by total rewards from passed attempts. Players see names only; admins also see each row’s email.
- **Dark mode** — nav toggle with theme persisted in the browser (no flash on load).

## Seed logins

Created when `SEED_ON_BOOT=true` or when you run `npm run db:seed` in `backend/`.

- Admin: `admin@quiz.com` / `Admin123!`
- Player: `user@quiz.com` / `User123!`

Both start at 500 credits. Two quizzes are published.

World Capitals, stake 100, reward 250, pass mark 75. Correct options: Paris, Tokyo, Ottawa, Nairobi.

Quick Arithmetic, stake 50, reward 150, pass mark 50. Correct options: 12, 27, 11, 4.

## Run with Docker

```bash
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:3001
- Swagger: http://localhost:3001/docs

The API container runs `prisma migrate deploy` and the seed on startup.

## Run without Docker

Requirements: Node.js 22 and PostgreSQL 16. If PostgreSQL is not installed, the API can boot an embedded server for local development:

```bash
cd backend
cp .env.example .env
npm install
npm run db:embedded
```

Leave that process running, then in another terminal:

```bash
cd backend
npx prisma migrate deploy
npm run db:seed
npm run start:dev
```

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Tests

From `backend/`:

```bash
npm test
```

The test script starts an embedded PostgreSQL, applies migrations, and runs Jest with Supertest. Covered paths:

- Register opens a 500 balance and one welcome ledger row
- Validation, duplicate email, and bad login
- A player token receives 403 on admin routes
- Correct answers are omitted from the player quiz payload
- Start deducts the stake
- A stake the balance cannot cover returns 409 and writes no attempt
- Pass pays the reward once; a second submit returns 409
- Fail keeps the stake and writes no reward
- Two concurrent submits settle once
- Two concurrent starts, when the balance covers only one stake, produce one attempt and one 409
- Replaying a purchase idempotency key credits the pack once
- Leaderboard hides player emails for `USER` tokens and includes them for `ADMIN`
- Success responses include `message` and `data`; errors include `code` and `message`
- `/docs-json` lists the credit, attempt, and leaderboard routes

## API map

Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`

Quizzes: `GET /quizzes`, `GET /quizzes/:id`

Attempts: `POST /quizzes/:id/attempts`, `POST /attempts/:id/submit`, `GET /attempts`, `GET /attempts/:id`

Credits: `GET /credits/balance`, `GET /credits/transactions`, `GET /credits/packs`, `POST /credits/purchase`

Leaderboard: `GET /leaderboard`

Admin: `GET /quizzes/manage`, `GET /quizzes/:id/manage`, `POST /quizzes`, `PATCH /quizzes/:id`, `POST /quizzes/:id/publish`, `POST /quizzes/:id/unpublish`, `POST /quizzes/:id/questions`, `PATCH /questions/:id`, `DELETE /questions/:id`

Successful responses use `{ "message": string, "data": … }`. The `data` object holds the route payload (lists use `{ "items": … }` inside `data`). Errors use `{ "statusCode", "code", "message" }` with a human-readable `message` (validation, auth, credits, and Prisma failures are mapped consistently) and are not wrapped. GET routes return **200** with a JSON body (ETags are disabled so the browser does not answer with **304 Not Modified**). `POST /auth/login` is **200**; most other writes are **201**. Validation is 422. A bad token is 401. A player calling an admin route is 403. Insufficient credits and a second settlement are 409.

Send `Authorization: Bearer <accessToken>` on protected routes.

OpenAPI models in Swagger describe each handler's payload shape. At runtime, successful JSON responses are wrapped as `{ "message", "data" }` by `ApiResponseInterceptor`; errors stay unwrapped.

## Demo script

1. Open http://localhost:3000 and sign in as `user@quiz.com` / `User123!`.
2. Open Wallet and confirm 500 credits and a Welcome bonus row.
3. Open World Capitals. Stake is 100, reward is 250, pass mark is 75.
4. Start the quiz. The balance chip drops to 400 before any answer is scored.
5. Answer Paris, Tokyo, Ottawa, Nairobi and submit.
6. The result shows a pass, score 100, stake −100, reward +250, net +150, and balance 650.
7. Submit is not offered again. Refreshing the result does not pay the reward a second time.
8. Open Leaderboard and confirm **Demo Player** appears with rewards earned (email visible only after signing in as admin).
9. On Wallet, buy the 200 credit pack. The ledger gains a Credit purchase row.
10. Sign out. Sign in as `admin@quiz.com` / `Admin123!`.
11. Open Admin, create a draft, add a question, and publish it. It appears on the player catalog only after publish.
12. Open http://localhost:3001/docs and authorize with a token from `POST /auth/login`.

## Architecture

```text
Browser (Next.js)
    |  Authorization: Bearer
    v
NestJS API  ---- Prisma transaction ---- PostgreSQL
    |
    +-- users, quizzes, questions, attempts, attempt_answers
    +-- credit_accounts.balance
    +-- credit_transactions   (append-only ledger)
```

The browser never calculates a score and never writes a balance. It calls the API. Swagger is generated from the Nest controllers, so `/docs-json` is the contract imported into DigitalAPI.

Production is two Cloud Run services. `quiz-api` connects to Cloud SQL through the Cloud SQL socket. `quiz-web` is a Next.js standalone server whose API URL is baked in at image build time. DigitalAPI's upstream is the Cloud Run API URL. The web app calls the API directly. Gateway credentials are for consumers calling through DigitalAPI.

## How balances stay consistent

The ledger is the record of what happened. `credit_accounts.balance` is the cached total, and it changes only in the same database transaction as a ledger insert.

Every movement goes through `applyLedger`:

1. Begin a Prisma interactive transaction.
2. If the idempotency key already exists, return that row and do not move the balance.
3. `SELECT ... FROM credit_accounts WHERE user_id = $1 FOR UPDATE`.
4. Reject the debit when `balance + amount` would be negative (`INSUFFICIENT_CREDITS`).
5. Insert the ledger row with `balanceAfter`, then update the cached balance.
6. Commit. A thrown error rolls the attempt, the ledger row, and the balance back together.

PostgreSQL also enforces `CHECK (balance >= 0)` on `credit_accounts`.

Stakes and rewards add two more gates:

- The stake idempotency key is `stake:<attemptId>`. A retried start creates a new attempt. It cannot apply the same stake twice.
- Submit locks the attempt row with `SELECT ... FOR UPDATE`, then updates it with `WHERE status = 'IN_PROGRESS'`. A second submit sees `SETTLED`, returns 409, and does not insert `QUIZ_REWARD`. The reward key `reward:<attemptId>` is unique, so a reward cannot be inserted twice even if the status check were skipped.
- Two concurrent starts serialize on the account row lock. The second transaction reads the balance after the first commit. When the remainder cannot cover the stake, it returns 409 and its attempt insert rolls back.

Purchase keys are stored as `purchase:<userId>:<clientKey>`. A unique index on `idempotency_key` plus a `P2002` retry path covers two requests arriving together.

The tests that lock this in are the concurrent stake test and the concurrent submit test. Both are in `backend/test/app.e2e-spec.ts`.

## Deploy to GCP

This step needs a billed GCP project and `gcloud auth login`. It was not executed in the workspace that produced this repository when those credentials were not available.

From Cloud Shell, at the repository root:

```bash
export GCP_PROJECT_ID="your-project"
export DB_PASSWORD="alphanumericpassword"
export JWT_SECRET="$(openssl rand -hex 32)"
bash scripts/deploy-gcp.sh
```

The script enables Cloud Run, Cloud SQL Admin, Artifact Registry, and Cloud Build. It creates a Postgres 16 instance `quiz-pg`, builds the API and web images, deploys `quiz-api` and `quiz-web`, then sets the API `CORS_ORIGIN` to the web URL.

**GitHub Actions:** push to `main` or run the **Deploy to GCP** workflow manually. One-time setup (service account + repository secrets) is in [`.github/GCP_DEPLOY.md`](.github/GCP_DEPLOY.md).

Record the printed URLs here after a real deploy:

- API: not deployed yet
- Web: not deployed yet
- Swagger: not deployed yet

Cloud SQL passwords in this script must be alphanumeric because the password is placed in `DATABASE_URL`.

## DigitalAPI

Do this after the Cloud Run API URL exists. The trial login is interactive, so these steps are manual.

1. Create an organisation at https://trial.digitalapi.ai. The first account is the organisation admin.
2. In API Gateway, define an API named Quiz Application API.
3. Import the OpenAPI document from `{API_URL}/docs-json`.
4. Set the upstream to the Cloud Run API origin and deploy the API to the gateway environment.
5. Attach a key-auth plugin on the gateway route. Callers send the gateway key to DigitalAPI. The API still requires its own user JWT on protected routes: log in through `POST /auth/login`, then send `Authorization: Bearer <accessToken>`.
6. Create an API product that includes this API, set a quota, and deploy the product to the same environment.
7. In the developer portal, complete the overview and documentation, set visibility, and move the API from Draft to Published.
8. As a consumer, create an application, subscribe it to the product, and call the gateway URL with the application credentials plus a user JWT.

Portal URL, after publish: not published yet

Example, after both URLs exist:

```bash
curl -s -X POST "$GATEWAY_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "apikey: $GATEWAY_KEY" \
  -d '{"email":"user@quiz.com","password":"User123!"}'
```

Use the header name the gateway plugin is configured to read. DigitalAPI's key-auth plugin commonly expects `apikey`.

## Interview submission guide

Use this when presenting the assignment to a senior panel.

### Quick proof (about 5 minutes)

1. From `backend/`, run `npm test` and point to the concurrent stake and concurrent submit tests.
2. Walk the **Demo script** above live, or screen-record it once.
3. Open **How balances stay consistent** and explain `FOR UPDATE`, idempotency keys, and the `IN_PROGRESS` settlement guard.
4. Show Swagger at `/docs` and mention `/docs-json` for DigitalAPI import.

### What already reads as senior-level

| Area | Evidence in this repo |
| --- | --- |
| Money correctness | Append-only ledger, balance updated only in the same transaction, row locks, DB `CHECK (balance >= 0)`, idempotent purchase and settlement |
| Concurrency | E2e tests for double submit and double stake under load |
| Security | JWT on protected routes, role guard for admin, server-side scoring, answers hidden until submit, bcrypt passwords, validation and whitelist on DTOs |
| API design | Stable error shape (`statusCode`, `code`, `message`), success envelope (`message`, `data`), OpenAPI |
| Operability | Docker Compose, Cloud Run script, health route, README architecture and credit deep dive |

### Be upfront about tradeoffs (shows maturity)

- **JWT in `localStorage`** on the web app: simple for a take-home; production might use httpOnly cookies or a BFF.
- **Swagger schemas** describe handler return types; at runtime successes are wrapped by `ApiResponseInterceptor` (documented in **API map**).
- **GCP and DigitalAPI** are scripted and documented but were not executed in the author environment without `gcloud` / portal login.
- **No rate limiting or WAF** in scope; gateway quota covers public exposure after DigitalAPI.

### Assignment checklist

| Requirement | Where |
| --- | --- |
| Register / login / JWT | `auth` module, e2e auth tests |
| Credits: welcome bonus, stake, reward, purchase | `credits/ledger.ts`, `attempts.service.ts`, e2e |
| Quizzes and admin CRUD | `quizzes`, `questions` modules, admin UI |
| Server-calculated score | `attempts.service.ts` `submit` |
| Tests | `backend/test/app.e2e-spec.ts` |
| Docker | `docker-compose.yml`, Dockerfiles |
| Deploy docs | `scripts/deploy-gcp.sh`, DigitalAPI section |
| Credit consistency write-up | **How balances stay consistent** |

### One-line pitch

"The API treats credits as a ledger with transactional balance updates and explicit concurrency tests; the UI is a thin client that never trusts the client for scoring or balances."

## Deployment status

| Surface | Status |
| --- | --- |
| Local API tests | 15 passing (`npm test` in `backend/`) |
| Docker Compose files | included; image build requires Docker |
| Cloud Run | script ready; needs `gcloud` login and billing |
| DigitalAPI portal | runbook ready; needs the Cloud Run URL and a trial login |
