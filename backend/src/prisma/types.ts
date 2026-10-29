import type { Prisma } from '@prisma/client';

/** App-facing aliases for generated Prisma models and helpers. */
export type User = Prisma.UserGetPayload<Record<string, never>>;
export type Quiz = Prisma.QuizGetPayload<Record<string, never>>;
export type Question = Prisma.QuestionGetPayload<Record<string, never>>;
export type CreditTransaction = Prisma.CreditTransactionGetPayload<Record<string, never>>;
export type TransactionClient = Prisma.TransactionClient;
export type JsonValue = Prisma.JsonValue;
