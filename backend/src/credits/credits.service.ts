import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AppException } from '../common/errors/app.exception';
import { CreditTransaction, TransactionClient } from '../prisma/types';
import { TransactionType } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import {
  ApiListResponse,
  BalanceResponse,
  CreditPackResponse,
  CreditTransactionResponse,
  PurchaseResponse,
} from '../common/api';
import { CREDIT_PACKS, WELCOME_BONUS_CREDITS, findPack } from './constants';
import { applyLedger } from './ledger';

@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  listPacks(): ApiListResponse<CreditPackResponse> {
    return { items: [...CREDIT_PACKS] };
  }

  async openAccountWithBonus(tx: TransactionClient, userId: string) {
    await tx.creditAccount.create({
      data: { userId, balance: 0 },
    });
    return applyLedger(tx, {
      userId,
      type: TransactionType.WELCOME_BONUS,
      amount: WELCOME_BONUS_CREDITS,
      idempotencyKey: `welcome:${userId}`,
      referenceType: 'signup',
      referenceId: userId,
    });
  }

  async getBalance(userId: string): Promise<BalanceResponse> {
    const account = await this.prisma.creditAccount.findUnique({ where: { userId } });
    if (!account) {
      throw new AppException(HttpStatus.NOT_FOUND, 'ACCOUNT_NOT_FOUND', 'Credit account not found');
    }
    return { balance: account.balance };
  }

  async listTransactions(userId: string): Promise<ApiListResponse<CreditTransactionResponse>> {
    const items = await this.prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { items: items.map(toTransaction) };
  }

  async purchase(userId: string, packId: string, idempotencyKey: string): Promise<PurchaseResponse> {
    const pack = findPack(packId);
    if (!pack) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'UNKNOWN_PACK',
        'That credit pack does not exist. Refresh the wallet page and try again.',
      );
    }
    const key = `purchase:${userId}:${idempotencyKey}`;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.creditTransaction.findUnique({
          where: { idempotencyKey: key },
        });
        if (existing) {
          if (existing.userId !== userId || existing.referenceId !== pack.id) {
            throw new AppException(
              HttpStatus.CONFLICT,
              'IDEMPOTENCY_CONFLICT',
              'This idempotency key was already used for a different purchase',
            );
          }
          const account = await tx.creditAccount.findUnique({ where: { userId } });
          return {
            replayed: true,
            balance: account?.balance ?? existing.balanceAfter,
            packId: pack.id,
            credits: existing.amount,
            transaction: toTransaction(existing),
          };
        }

        const ledger = await applyLedger(tx, {
          userId,
          type: TransactionType.PURCHASE,
          amount: pack.credits,
          idempotencyKey: key,
          referenceType: 'pack',
          referenceId: pack.id,
        });
        return {
          replayed: false,
          balance: ledger.balance,
          packId: pack.id,
          credits: pack.credits,
          transaction: toTransaction(ledger.transaction),
        };
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prisma.creditTransaction.findUnique({
          where: { idempotencyKey: key },
        });
        if (existing && existing.userId === userId && existing.referenceId === pack.id) {
          const account = await this.prisma.creditAccount.findUnique({ where: { userId } });
          return {
            replayed: true,
            balance: account?.balance ?? existing.balanceAfter,
            packId: pack.id,
            credits: existing.amount,
            transaction: toTransaction(existing),
          };
        }
      }
      throw error;
    }
  }
}

export function toTransaction(transaction: CreditTransaction): CreditTransactionResponse {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    balanceAfter: transaction.balanceAfter,
    referenceType: transaction.referenceType,
    referenceId: transaction.referenceId,
    createdAt: transaction.createdAt.toISOString(),
  };
}
