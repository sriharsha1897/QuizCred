import { AttemptStatus } from '../enums';

export interface AttemptQuizResponse {
  id: string;
  title: string;
  stake: number;
  reward: number;
  passMark: number;
}

export interface AttemptQuestionResponse {
  id: string;
  prompt: string;
  options: string[];
  order: number;
  correctIndex?: number;
  selectedIndex?: number | null;
}

export interface AttemptSessionResponse {
  id: string;
  status: AttemptStatus;
  stakeAmount: number;
  score: number | null;
  passed: boolean | null;
  rewardAmount: number | null;
  accountBalance: number;
  quiz: AttemptQuizResponse;
  questions: AttemptQuestionResponse[];
}

export interface SettledAttemptResponse {
  id: string;
  status: typeof AttemptStatus.SETTLED;
  stakeAmount: number;
  score: number;
  passed: boolean;
  rewardAmount: number;
  accountBalance: number;
  quiz: AttemptQuizResponse;
  questions: AttemptQuestionResponse[];
}

export interface AttemptListItemResponse {
  id: string;
  status: AttemptStatus;
  stakeAmount: number;
  score: number | null;
  passed: boolean | null;
  rewardAmount: number | null;
  startedAt: string;
  submittedAt: string | null;
  quiz: {
    id: string;
    title: string;
  };
}

export interface AttemptDetailResponse extends AttemptSessionResponse {
  startedAt: string;
  submittedAt: string | null;
}
