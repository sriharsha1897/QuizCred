export const TransactionType = {
  WELCOME_BONUS: 'WELCOME_BONUS',
  STAKE: 'STAKE',
  QUIZ_REWARD: 'QUIZ_REWARD',
  PURCHASE: 'PURCHASE',
} as const;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];
