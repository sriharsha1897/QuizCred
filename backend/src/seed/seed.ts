import { $Enums, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/enums';
import { WELCOME_BONUS_CREDITS } from '../credits/constants';
import { applyLedger } from '../credits/ledger';
import { seedQuizzes } from './seed-data';

export async function seed() {
  const prisma = new PrismaClient();
  try {
    const admin = await upsertUser(prisma, {
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@quiz.com',
      password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!',
      role: Role.ADMIN,
      firstName: 'Quiz',
      lastName: 'Admin',
    });
    const player = await upsertUser(prisma, {
      email: process.env.SEED_USER_EMAIL ?? 'user@quiz.com',
      password: process.env.SEED_USER_PASSWORD ?? 'User123!',
      role: Role.USER,
      firstName: 'Demo',
      lastName: 'Player',
    });
    await ensureAccount(prisma, admin.id);
    await ensureAccount(prisma, player.id);

    for (const quiz of seedQuizzes) {
      const existing = await prisma.quiz.findFirst({ where: { title: quiz.title } });
      if (existing) continue;
      await prisma.quiz.create({
        data: {
          title: quiz.title,
          description: quiz.description,
          stake: quiz.stake,
          reward: quiz.reward,
          passMark: quiz.passMark,
          published: true,
          createdById: admin.id,
          questions: {
            create: quiz.questions.map((question, index) => ({
              prompt: question.prompt,
              options: question.options,
              correctIndex: question.correctIndex,
              order: index + 1,
            })),
          },
        },
      });
    }
    console.log('Seed complete');
  } finally {
    await prisma.$disconnect();
  }
}

async function upsertUser(
  prisma: PrismaClient,
  input: {
    email: string;
    password: string;
    role: Role;
    firstName?: string;
    lastName?: string;
  },
) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (input.firstName !== undefined || input.lastName !== undefined) {
      return prisma.user.update({
        where: { id: existing.id },
        data: {
          firstName: input.firstName ?? null,
          lastName: input.lastName ?? null,
        },
      });
    }
    return existing;
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      role: toPrismaRole(input.role),
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
    },
  });
}

function toPrismaRole(role: Role): $Enums.Role {
  return role === Role.ADMIN ? $Enums.Role.ADMIN : $Enums.Role.USER;
}

async function ensureAccount(prisma: PrismaClient, userId: string) {
  const existing = await prisma.creditAccount.findUnique({ where: { userId } });
  if (existing) return;
  await prisma.$transaction(async (tx) => {
    await tx.creditAccount.create({ data: { userId, balance: 0 } });
    await applyLedger(tx, {
      userId,
      type: $Enums.TransactionType.WELCOME_BONUS,
      amount: WELCOME_BONUS_CREDITS,
      idempotencyKey: `welcome:${userId}`,
      referenceType: 'signup',
      referenceId: userId,
    });
  });
}
