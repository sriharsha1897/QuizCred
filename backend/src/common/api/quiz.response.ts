export interface QuizSummaryResponse {
  id: string;
  title: string;
  description: string;
  stake: number;
  reward: number;
  passMark: number;
  published: boolean;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerQuestionResponse {
  id: string;
  prompt: string;
  options: string[];
  order: number;
}

export interface PlayerQuizResponse {
  id: string;
  title: string;
  description: string;
  stake: number;
  reward: number;
  passMark: number;
  published: boolean;
  questionCount: number;
  questions: PlayerQuestionResponse[];
}

export interface ManagedQuestionResponse {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  order: number;
}

export interface ManagedQuizResponse extends QuizSummaryResponse {
  questions: ManagedQuestionResponse[];
}
