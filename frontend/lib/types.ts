export type Role = 'USER' | 'ADMIN';

export type SessionUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
};

export type AuthResponse = {
  accessToken: string;
  user: SessionUser;
};

export type QuizSummary = {
  id: string;
  title: string;
  description: string;
  stake: number;
  reward: number;
  passMark: number;
  published: boolean;
  questionCount: number;
};

export type QuestionView = {
  id: string;
  prompt: string;
  options: string[];
  order: number;
  correctIndex?: number;
  selectedIndex?: number | null;
};

export type ManagedQuestion = {
  id: string;
  quizId?: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  order: number;
};

export type AttemptView = {
  id: string;
  status: 'IN_PROGRESS' | 'SETTLED';
  stakeAmount: number;
  score: number | null;
  passed: boolean | null;
  rewardAmount: number | null;
  accountBalance: number;
  quiz: {
    id: string;
    title: string;
    stake: number;
    reward: number;
    passMark: number;
  };
  questions: QuestionView[];
};

export type AttemptListItem = {
  id: string;
  status: 'IN_PROGRESS' | 'SETTLED';
  stakeAmount: number;
  score: number | null;
  passed: boolean | null;
  rewardAmount: number | null;
  startedAt: string;
  submittedAt: string | null;
  quiz: { id: string; title: string };
};

export type LedgerEntry = {
  id: string;
  type: 'WELCOME_BONUS' | 'STAKE' | 'QUIZ_REWARD' | 'PURCHASE';
  amount: number;
  balanceAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
};

export type CreditPack = {
  id: string;
  credits: number;
  priceLabel: string;
};

export type LeaderboardEntry = {
  rank: number;
  displayName: string;
  totalRewards: number;
  quizzesPassed: number;
  email?: string;
};
