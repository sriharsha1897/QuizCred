import { HttpStatus, Injectable } from '@nestjs/common';
import { JsonValue } from '../prisma/types';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AppException } from '../common/errors/app.exception';
import { PrismaService } from '../prisma/prisma.service';
import { asOptions, assertQuestionShape } from '../common/question-shape';
import { DeleteQuestionResponse, QuestionResponse } from '../common/api';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(quizId: string, dto: CreateQuestionDto): Promise<QuestionResponse> {
    assertQuestionShape(dto);
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      throw new AppException(HttpStatus.NOT_FOUND, 'QUIZ_NOT_FOUND', 'Quiz not found');
    }
    try {
      const question = await this.prisma.question.create({
        data: {
          quizId,
          prompt: dto.prompt.trim(),
          options: dto.options,
          correctIndex: dto.correctIndex,
          order: dto.order,
        },
      });
      return toQuestion(question);
    } catch (error) {
      throw mapOrderConflict(error);
    }
  }

  async update(id: string, dto: UpdateQuestionDto): Promise<QuestionResponse> {
    const current = await this.prisma.question.findUnique({ where: { id } });
    if (!current) {
      throw new AppException(HttpStatus.NOT_FOUND, 'QUESTION_NOT_FOUND', 'Question not found');
    }
    const options = dto.options ?? asOptions(current.options);
    const correctIndex = dto.correctIndex ?? current.correctIndex;
    assertQuestionShape({ options, correctIndex });
    try {
      const question = await this.prisma.question.update({
        where: { id },
        data: {
          prompt: dto.prompt?.trim(),
          options: dto.options,
          correctIndex: dto.correctIndex,
          order: dto.order,
        },
      });
      return toQuestion(question);
    } catch (error) {
      throw mapOrderConflict(error);
    }
  }

  async remove(id: string): Promise<DeleteQuestionResponse> {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) {
      throw new AppException(HttpStatus.NOT_FOUND, 'QUESTION_NOT_FOUND', 'Question not found');
    }
    const attempts = await this.prisma.attempt.count({ where: { quizId: question.quizId } });
    if (attempts > 0) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'QUESTION_IN_USE',
        'Questions cannot be deleted after a player has started this quiz',
      );
    }
    await this.prisma.question.delete({ where: { id } });
    return { id, deleted: true };
  }
}

function toQuestion(question: {
  id: string;
  quizId: string;
  prompt: string;
  options: JsonValue;
  correctIndex: number;
  order: number;
}): QuestionResponse {
  return {
    id: question.id,
    quizId: question.quizId,
    prompt: question.prompt,
    options: asOptions(question.options),
    correctIndex: question.correctIndex,
    order: question.order,
  };
}

function mapOrderConflict(error: unknown) {
  if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
    return new AppException(
      HttpStatus.CONFLICT,
      'ORDER_TAKEN',
      'Another question in this quiz already uses that order',
    );
  }
  return error;
}
