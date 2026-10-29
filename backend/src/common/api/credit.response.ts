import { TransactionType } from '../enums';

export interface CreditPackResponse {
  id: string;
  credits: number;
  priceLabel: string;
}

export interface BalanceResponse {
  balance: number;
}

export interface CreditTransactionResponse {
  id: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface PurchaseResponse {
  replayed: boolean;
  balance: number;
  packId: string;
  credits: number;
  transaction: CreditTransactionResponse;
}
