import { HttpStatus } from '@nestjs/common';
import { TransactionType } from '../common/enums';
import { TransactionClient } from '../prisma/types';
import { AppException } from '../common/errors/app.exception';

export type LedgerInput = {
  userId: string;
  type: TransactionType;
  amount: number;
  idempotencyKey: string;
  referenceType?: string;
  referenceId?: string;
};

type AccountRow = { id: string; balance: number };

export async function lockAccount(
  tx: TransactionClient,
  userId: string,
): Promise<AccountRow> {
  // Hold the row until this transaction commits so two stakes cannot spend the same credits.
  const rows = await tx.$queryRawUnsafe<AccountRow[]>(
    `SELECT id, balance
     FROM credit_accounts
     WHERE user_id = $1::uuid
     FOR UPDATE`,
    userId,
  );
  const account = rows[0];
  if (!account) {
    throw new AppException(HttpStatus.NOT_FOUND, 'ACCOUNT_NOT_FOUND', 'Credit account not found');
  }
  return { id: account.id, balance: Number(account.balance) };
}

export async function applyLedger(tx: TransactionClient, input: LedgerInput) {
  const existing = await tx.creditTransaction.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    if (existing.userId !== input.userId) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'IDEMPOTENCY_CONFLICT',
        'This idempotency key was already used by another account',
      );
    }
    return { transaction: existing, replayed: true as const, balance: existing.balanceAfter };
  }

  const account = await lockAccount(tx, input.userId);
  const next = account.balance + input.amount;
  if (next < 0) {
    throw new AppException(
      HttpStatus.CONFLICT,
      'INSUFFICIENT_CREDITS',
      'You do not have enough credits for this action',
    );
  }

  await tx.creditAccount.update({
    where: { id: account.id },
    data: { balance: next },
  });

  const transaction = await tx.creditTransaction.create({
    data: {
      accountId: account.id,
      userId: input.userId,
      type: input.type,
      amount: input.amount,
      balanceAfter: next,
      idempotencyKey: input.idempotencyKey,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
    },
  });

  return { transaction, replayed: false as const, balance: next };
}
