export const AttemptStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  SETTLED: 'SETTLED',
} as const;

export type AttemptStatus = (typeof AttemptStatus)[keyof typeof AttemptStatus];
