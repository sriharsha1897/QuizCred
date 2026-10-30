---
name: dev-stack
description: Run or verify QuizCred locally (Docker or Node). Use when starting the app, debugging integration, or before manual QA.
---

# Run QuizCred dev stack

## Docker (recommended)

From repo root:

```bash
docker compose up --build
```

- Web http://localhost:3000
- API http://localhost:3001
- Swagger http://localhost:3001/docs

## Local Node

**Backend** (terminal 1):

```bash
cd backend
cp .env.example .env
npm install
npm run db:embedded
```

**Backend** (terminal 2):

```bash
cd backend
npx prisma migrate deploy
npm run db:seed
npm run start:dev
```

**Frontend**:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Verify

```bash
cd backend && npm test
```

Seed logins: `user@quiz.com` / `User123!`, `admin@quiz.com` / `Admin123!`.
