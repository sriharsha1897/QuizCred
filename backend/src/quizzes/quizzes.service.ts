import { HttpStatus, Injectable } from "@nestjs/common";
import { Question, Quiz } from "../prisma/types";
import { AppException } from "../common/errors/app.exception";
import { PrismaService } from "../prisma/prisma.service";
import { CreateQuizDto } from "./dto/create-quiz.dto";
import { UpdateQuizDto } from "./dto/update-quiz.dto";
import {
  ApiListResponse,
  ManagedQuizResponse,
  PlayerQuizResponse,
  QuizSummaryResponse,
} from "../common/api";
import { asOptions } from "../common/question-shape";

type QuizWithCount = Quiz & { _count: { questions: number } };
type QuizWithQuestions = Quiz & { questions: Question[] };

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished(): Promise<ApiListResponse<QuizSummaryResponse>> {
    const quizzes = await this.prisma.quiz.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questions: true } } },
    });
    return { items: quizzes.map(toSummary) };
  }

  async listManaged(): Promise<ApiListResponse<QuizSummaryResponse>> {
    const quizzes = await this.prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questions: true } } },
    });
    return { items: quizzes.map(toSummary) };
  }

  async getPublished(id: string): Promise<PlayerQuizResponse> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    if (!quiz || !quiz.published) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        "QUIZ_NOT_FOUND",
        "Quiz not found",
      );
    }
    return toPlayerQuiz(quiz);
  }

  async getManaged(id: string): Promise<ManagedQuizResponse> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    if (!quiz) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        "QUIZ_NOT_FOUND",
        "Quiz not found",
      );
    }
    return {
      ...toSummary({ ...quiz, _count: { questions: quiz.questions.length } }),
      questions: quiz.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        options: asOptions(question.options),
        correctIndex: question.correctIndex,
        order: question.order,
      })),
    };
  }

  async create(
    authorId: string,
    dto: CreateQuizDto,
  ): Promise<QuizSummaryResponse> {
    const quiz = await this.prisma.quiz.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        stake: dto.stake,
        reward: dto.reward,
        passMark: dto.passMark,
        published: false,
        createdById: authorId,
      },
      include: { _count: { select: { questions: true } } },
    });
    return toSummary(quiz);
  }

  async update(id: string, dto: UpdateQuizDto): Promise<QuizSummaryResponse> {
    await this.requireQuiz(id);
    const quiz = await this.prisma.quiz.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        stake: dto.stake,
        reward: dto.reward,
        passMark: dto.passMark,
      },
      include: { _count: { select: { questions: true } } },
    });
    return toSummary(quiz);
  }

  async publish(id: string): Promise<QuizSummaryResponse> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { _count: { select: { questions: true } } },
    });
    if (!quiz) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        "QUIZ_NOT_FOUND",
        "Quiz not found",
      );
    }
    if (quiz._count.questions < 1) {
      throw new AppException(
        HttpStatus.CONFLICT,
        "QUIZ_HAS_NO_QUESTIONS",
        "Add at least one question before publishing",
      );
    }
    const updated = await this.prisma.quiz.update({
      where: { id },
      data: { published: true },
      include: { _count: { select: { questions: true } } },
    });
    return toSummary(updated);
  }

  async unpublish(id: string): Promise<QuizSummaryResponse> {
    await this.requireQuiz(id);
    const quiz = await this.prisma.quiz.update({
      where: { id },
      data: { published: false },
      include: { _count: { select: { questions: true } } },
    });
    return toSummary(quiz);
  }

  private async requireQuiz(id: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        "QUIZ_NOT_FOUND",
        "Quiz not found",
      );
    }
    return quiz;
  }
}

export function toSummary(quiz: QuizWithCount): QuizSummaryResponse {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    stake: quiz.stake,
    reward: quiz.reward,
    passMark: quiz.passMark,
    published: quiz.published,
    questionCount: quiz._count.questions,
    createdAt: quiz.createdAt.toISOString(),
    updatedAt: quiz.updatedAt.toISOString(),
  };
}

export function toPlayerQuiz(quiz: QuizWithQuestions): PlayerQuizResponse {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    stake: quiz.stake,
    reward: quiz.reward,
    passMark: quiz.passMark,
    published: quiz.published,
    questionCount: quiz.questions.length,
    questions: quiz.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      options: asOptions(question.options),
      order: question.order,
    })),
  };
}
