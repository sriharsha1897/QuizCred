import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { INestApplication } from '@nestjs/common';
import { Role } from '../src/common/enums';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { createApp } from '../src/main';
import { PrismaService } from '../src/prisma/prisma.service';

type AuthBody = { accessToken: string; user: { id: string; email: string; role: string } };
type QuizBody = {
  id: string;
  questions: { id: string; correctIndex: number }[];
};

type ApiEnvelope<T> = { message: string; data: T };

describe('Quiz API', () => {
  let app: INestApplication;
  let http: App;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    const urlFile = path.join(__dirname, '..', '.test-db-url');
    process.env.DATABASE_URL = fs.readFileSync(urlFile, 'utf8').trim();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1d';
    process.env.CORS_ORIGIN = 'http://localhost:3000';
    execSync('npx prisma migrate deploy', {
      cwd: path.join(__dirname, '..'),
      env: process.env,
      stdio: 'inherit',
    });
    app = await createApp();
    await app.init();
    http = app.getHttpServer();
    prisma = app.get(PrismaService);
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    await prisma.user.create({
      data: {
        email: 'admin@test.local',
        passwordHash,
        role: Role.ADMIN,
        creditAccount: { create: { balance: 0 } },
      },
    });
    const login = await request(http)
      .post('/auth/login')
      .send({ email: 'admin@test.local', password: 'Admin123!' })
      .expect(200);
    adminToken = data(login.body as ApiEnvelope<AuthBody>).accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('wraps success as message plus data and errors with code plus message', async () => {
    const auth = await register('envelope@test.local');
    const balance = await request(http)
      .get('/credits/balance')
      .set(bearer(auth.accessToken))
      .expect(200);
    expect(typeof balance.body.message).toBe('string');
    expect(balance.body.message.length).toBeGreaterThan(0);
    expect(balance.body.data.balance).toBe(500);

    const duplicate = await request(http)
      .post('/auth/register')
      .send({ email: 'envelope@test.local', password: 'password123' })
      .expect(409);
    expect(duplicate.body.code).toBe('EMAIL_TAKEN');
    expect(typeof duplicate.body.message).toBe('string');
    expect(duplicate.body.message.length).toBeGreaterThan(0);
    expect(duplicate.body.data).toBeUndefined();
  });

  it('opens a 500 credit balance and a welcome ledger row on register', async () => {
    const auth = await register('welcome@test.local');
    const balance = await request(http)
      .get('/credits/balance')
      .set(bearer(auth.accessToken))
      .expect(200);
    expect(balance.body.data.balance).toBe(500);
    const ledger = await request(http)
      .get('/credits/transactions')
      .set(bearer(auth.accessToken))
      .expect(200);
    expect(ledger.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'WELCOME_BONUS', amount: 500, balanceAfter: 500 }),
      ]),
    );
  });

  it('rejects a duplicate email, a short password, and a bad login', async () => {
    await register('dup@test.local');
    const duplicate = await request(http)
      .post('/auth/register')
      .send({ email: 'dup@test.local', password: 'password123' })
      .expect(409);
    expect(duplicate.body.code).toBe('EMAIL_TAKEN');

    const invalid = await request(http)
      .post('/auth/register')
      .send({ email: 'short@test.local', password: 'short', role: 'ADMIN' })
      .expect(422);
    expect(invalid.body.code).toBe('VALIDATION_ERROR');

    const badEmail = await request(http)
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'password123' })
      .expect(422);
    expect(badEmail.body.code).toBe('VALIDATION_ERROR');
    expect(badEmail.body.message).toMatch(/valid email/i);

    const login = await request(http)
      .post('/auth/login')
      .send({ email: 'dup@test.local', password: 'wrong-password' })
      .expect(401);
    expect(login.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('requires a token and refuses admin routes to a player', async () => {
    await request(http).get('/quizzes').expect(401);
    const player = await register('player-role@test.local');
    const denied = await request(http)
      .post('/quizzes')
      .set(bearer(player.accessToken))
      .send(quizBody('Hidden', 100, 200, 50))
      .expect(403);
    expect(denied.body.code).toBe('FORBIDDEN');
  });

  it('blocks player tokens from every admin quiz and question route', async () => {
    const player = await register('player-admin-apis@test.local');
    const quiz = await createPublishedQuiz('Locked Admin', 50, 100, 50);
    const token = bearer(player.accessToken);

    await request(http).get('/quizzes/manage').set(token).expect(403);
    await request(http).get(`/quizzes/${quiz.id}/manage`).set(token).expect(403);
    await request(http)
      .patch(`/quizzes/${quiz.id}`)
      .set(token)
      .send({ title: 'Hijacked' })
      .expect(403);
    await request(http).post(`/quizzes/${quiz.id}/publish`).set(token).expect(403);
    await request(http).post(`/quizzes/${quiz.id}/unpublish`).set(token).expect(403);
    await request(http)
      .post(`/quizzes/${quiz.id}/questions`)
      .set(token)
      .send({
        prompt: 'Blocked?',
        options: ['a', 'b'],
        correctIndex: 0,
        order: 99,
      })
      .expect(403);
    await request(http)
      .patch(`/questions/${quiz.questions[0].id}`)
      .set(token)
      .send({ prompt: 'Blocked edit' })
      .expect(403);
    await request(http).delete(`/questions/${quiz.questions[0].id}`).set(token).expect(403);
  });

  it('hides drafts and correct answers from players', async () => {
    const quiz = await createPublishedQuiz('Visible Capitals', 100, 250, 100);
    const player = await register('reader@test.local');
    const list = await request(http).get('/quizzes').set(bearer(player.accessToken)).expect(200);
    expect(list.body.data.items.some((item: { id: string }) => item.id === quiz.id)).toBe(true);
    const detail = await request(http)
      .get(`/quizzes/${quiz.id}`)
      .set(bearer(player.accessToken))
      .expect(200);
    expect(detail.body.data.questions[0].correctIndex).toBeUndefined();
    expect(detail.body.data.questions).toHaveLength(2);
  });

  it('deducts the stake when an attempt starts', async () => {
    const quiz = await createPublishedQuiz('Stake Quiz', 100, 250, 100);
    const player = await register('staker@test.local');
    const started = await request(http)
      .post(`/quizzes/${quiz.id}/attempts`)
      .set(bearer(player.accessToken))
      .expect(201);
    expect(started.body.data.accountBalance).toBe(400);
    expect(started.body.data.stakeAmount).toBe(100);
    expect(started.body.data.questions[0].correctIndex).toBeUndefined();
    const balance = await request(http)
      .get('/credits/balance')
      .set(bearer(player.accessToken))
      .expect(200);
    expect(balance.body.data.balance).toBe(400);
  });

  it('rejects a stake the balance cannot cover and writes no attempt', async () => {
    const quiz = await createPublishedQuiz('Expensive Quiz', 600, 900, 100);
    const player = await register('broke@test.local');
    const before = await prisma.attempt.count({ where: { userId: player.user.id } });
    const denied = await request(http)
      .post(`/quizzes/${quiz.id}/attempts`)
      .set(bearer(player.accessToken))
      .expect(409);
    expect(denied.body.code).toBe('INSUFFICIENT_CREDITS');
    const after = await prisma.attempt.count({ where: { userId: player.user.id } });
    expect(after).toBe(before);
    const balance = await request(http)
      .get('/credits/balance')
      .set(bearer(player.accessToken))
      .expect(200);
    expect(balance.body.data.balance).toBe(500);
  });

  it('pays the reward once when the player passes', async () => {
    const quiz = await createPublishedQuiz('Pass Quiz', 100, 250, 100);
    const player = await register('passer@test.local');
    const started = await request(http)
      .post(`/quizzes/${quiz.id}/attempts`)
      .set(bearer(player.accessToken))
      .expect(201);
    const submitted = await request(http)
      .post(`/attempts/${started.body.data.id}/submit`)
      .set(bearer(player.accessToken))
      .send(correctAnswers(quiz))
      .expect(201);
    expect(submitted.body.data.passed).toBe(true);
    expect(submitted.body.data.score).toBe(100);
    expect(submitted.body.data.rewardAmount).toBe(250);
    expect(submitted.body.data.accountBalance).toBe(650);
    expect(submitted.body.data.questions[0].correctIndex).toBe(quiz.questions[0].correctIndex);

    const again = await request(http)
      .post(`/attempts/${started.body.data.id}/submit`)
      .set(bearer(player.accessToken))
      .send(correctAnswers(quiz))
      .expect(409);
    expect(again.body.code).toBe('ALREADY_SETTLED');
    const balance = await request(http)
      .get('/credits/balance')
      .set(bearer(player.accessToken))
      .expect(200);
    expect(balance.body.data.balance).toBe(650);
  });

  it('keeps the stake when the player fails', async () => {
    const quiz = await createPublishedQuiz('Fail Quiz', 100, 250, 100);
    const player = await register('failer@test.local');
    const started = await request(http)
      .post(`/quizzes/${quiz.id}/attempts`)
      .set(bearer(player.accessToken))
      .expect(201);
    const submitted = await request(http)
      .post(`/attempts/${started.body.data.id}/submit`)
      .set(bearer(player.accessToken))
      .send(wrongAnswers(quiz))
      .expect(201);
    expect(submitted.body.data.passed).toBe(false);
    expect(submitted.body.data.score).toBe(0);
    expect(submitted.body.data.rewardAmount).toBe(0);
    expect(submitted.body.data.accountBalance).toBe(400);
    const rewards = await prisma.creditTransaction.count({
      where: { userId: player.user.id, type: 'QUIZ_REWARD' },
    });
    expect(rewards).toBe(0);
  });

  it('settles two concurrent submits once', async () => {
    const quiz = await createPublishedQuiz('Race Submit', 100, 250, 100);
    const player = await register('double-submit@test.local');
    const started = await request(http)
      .post(`/quizzes/${quiz.id}/attempts`)
      .set(bearer(player.accessToken))
      .expect(201);
    const payload = correctAnswers(quiz);
    const [first, second] = await Promise.all([
      request(http)
        .post(`/attempts/${started.body.data.id}/submit`)
        .set(bearer(player.accessToken))
        .send(payload),
      request(http)
        .post(`/attempts/${started.body.data.id}/submit`)
        .set(bearer(player.accessToken))
        .send(payload),
    ]);
    const statuses = [first.status, second.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409]);
    const balance = await request(http)
      .get('/credits/balance')
      .set(bearer(player.accessToken))
      .expect(200);
    expect(balance.body.data.balance).toBe(650);
    const rewards = await prisma.creditTransaction.count({
      where: { userId: player.user.id, type: 'QUIZ_REWARD' },
    });
    expect(rewards).toBe(1);
  });

  it('lets only one of two concurrent stakes spend a balance that covers one entry', async () => {
    const quiz = await createPublishedQuiz('Race Stake', 500, 800, 100);
    const player = await register('race-stake@test.local');
    const [first, second] = await Promise.all([
      request(http).post(`/quizzes/${quiz.id}/attempts`).set(bearer(player.accessToken)),
      request(http).post(`/quizzes/${quiz.id}/attempts`).set(bearer(player.accessToken)),
    ]);
    const statuses = [first.status, second.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409]);
    const denied = first.status === 409 ? first : second;
    expect(denied.body.code).toBe('INSUFFICIENT_CREDITS');
    const balance = await request(http)
      .get('/credits/balance')
      .set(bearer(player.accessToken))
      .expect(200);
    expect(balance.body.data.balance).toBe(0);
    const attempts = await prisma.attempt.count({ where: { userId: player.user.id } });
    expect(attempts).toBe(1);
  });

  it('credits a pack once when the same idempotency key is replayed', async () => {
    const player = await register('buyer@test.local');
    const key = 'order-key-001';
    const first = await request(http)
      .post('/credits/purchase')
      .set(bearer(player.accessToken))
      .send({ packId: 'pack_200', idempotencyKey: key })
      .expect(201);
    expect(first.body.data.replayed).toBe(false);
    expect(first.body.data.balance).toBe(700);
    const second = await request(http)
      .post('/credits/purchase')
      .set(bearer(player.accessToken))
      .send({ packId: 'pack_200', idempotencyKey: key })
      .expect(201);
    expect(second.body.data.replayed).toBe(true);
    expect(second.body.data.balance).toBe(700);
    const purchases = await prisma.creditTransaction.count({
      where: { userId: player.user.id, type: 'PURCHASE' },
    });
    expect(purchases).toBe(1);
  });

  it('hides emails on the leaderboard for players and shows them for admins', async () => {
    const quiz = await createPublishedQuiz('Leaderboard quiz', 10, 150, 50);
    const top = await register('leader-top@test.local');
    const other = await register('leader-other@test.local');
    const topStart = await request(http)
      .post(`/quizzes/${quiz.id}/attempts`)
      .set(bearer(top.accessToken))
      .expect(201);
    await request(http)
      .post(`/attempts/${topStart.body.data.id}/submit`)
      .set(bearer(top.accessToken))
      .send(correctAnswers(quiz))
      .expect(201);
    const otherStart = await request(http)
      .post(`/quizzes/${quiz.id}/attempts`)
      .set(bearer(other.accessToken))
      .expect(201);
    await request(http)
      .post(`/attempts/${otherStart.body.data.id}/submit`)
      .set(bearer(other.accessToken))
      .send(wrongAnswers(quiz))
      .expect(201);

    const playerView = await request(http)
      .get('/leaderboard')
      .set(bearer(top.accessToken))
      .expect(200);
    const topRow = playerView.body.data.items.find(
      (row: { displayName: string }) => row.displayName === 'leader-top',
    );
    expect(topRow).toBeDefined();
    expect(topRow.totalRewards).toBe(150);
    expect(topRow.email).toBeUndefined();
    for (const row of playerView.body.data.items) {
      expect(row.email).toBeUndefined();
    }

    const adminView = await request(http).get('/leaderboard').set(bearer(adminToken)).expect(200);
    const adminTopRow = adminView.body.data.items.find(
      (row: { displayName: string }) => row.displayName === 'leader-top',
    );
    expect(adminTopRow.email).toBe('leader-top@test.local');
  });

  it('publishes an OpenAPI document that lists the credit and attempt routes', async () => {
    const res = await request(http).get('/docs-json').expect(200);
    expect(Object.keys(res.body.paths)).toEqual(
      expect.arrayContaining([
        '/auth/register',
        '/auth/login',
        '/quizzes',
        '/quizzes/{id}',
        '/quizzes/{id}/attempts',
        '/attempts/{id}/submit',
        '/credits/balance',
        '/credits/transactions',
        '/credits/packs',
        '/credits/purchase',
        '/leaderboard',
      ]),
    );
  });

  async function register(email: string) {
    const res = await request(http)
      .post('/auth/register')
      .send({ email, password: 'password123' })
      .expect(201);
    return data(res.body as ApiEnvelope<AuthBody>);
  }

  async function createPublishedQuiz(
    title: string,
    stake: number,
    reward: number,
    passMark: number,
  ): Promise<QuizBody> {
    const created = await request(http)
      .post('/quizzes')
      .set(bearer(adminToken))
      .send(quizBody(title, stake, reward, passMark))
      .expect(201);
    const questions = [
      {
        prompt: `${title} first?`,
        options: ['no', 'yes'],
        correctIndex: 1,
        order: 1,
      },
      {
        prompt: `${title} second?`,
        options: ['no', 'yes'],
        correctIndex: 1,
        order: 2,
      },
    ];
    const saved = [];
    for (const question of questions) {
      const res = await request(http)
        .post(`/quizzes/${created.body.data.id}/questions`)
        .set(bearer(adminToken))
        .send(question)
        .expect(201);
      saved.push(data(res.body as ApiEnvelope<{ id: string; correctIndex: number }>));
    }
    await request(http)
      .post(`/quizzes/${created.body.data.id}/publish`)
      .set(bearer(adminToken))
      .expect(201);
    return { id: created.body.data.id as string, questions: saved };
  }
});

function data<T>(body: ApiEnvelope<T>): T {
  return body.data;
}

function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function quizBody(title: string, stake: number, reward: number, passMark: number) {
  return {
    title,
    description: `${title} description for players.`,
    stake,
    reward,
    passMark,
  };
}

function correctAnswers(quiz: QuizBody) {
  return {
    answers: quiz.questions.map((question) => ({
      questionId: question.id,
      selectedIndex: question.correctIndex,
    })),
  };
}

function wrongAnswers(quiz: QuizBody) {
  return {
    answers: quiz.questions.map((question) => ({
      questionId: question.id,
      selectedIndex: 0,
    })),
  };
}
