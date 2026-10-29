export interface QuestionResponse {
  id: string;
  quizId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  order: number;
}

export interface DeleteQuestionResponse {
  id: string;
  deleted: true;
}
