import { HttpStatus, Injectable } from '@nestjs/common';
import { Question, TransactionClient } from '../prisma/types';
import { AttemptStatus, TransactionType } from '../common/enums';
import { AppException } from '../common/errors/app.exception';
import { applyLedger, lockAccount } from '../credits/ledger';
import { PrismaService } from '../prisma/prisma.service';
import { asOptions } from '../common/question-shape';
import {
  ApiListResponse,
  AttemptDetailResponse,
  AttemptListItemResponse,
  AttemptQuestionResponse,
  AttemptQuizResponse,
  AttemptSessionResponse,
  SettledAttemptResponse,
} from '../common/api';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

type LockedAttempt = {
  id: string;
  status: string;
  userId: string;
  quizId: string;
  stakeAmount: number;
};

@Injectable()
export class AttemptsService {
  constructor(private readonly prisma: PrismaService) {}

  async start(userId: string, quizId: string): Promise<AttemptSessionResponse> {
    return this.prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.findUnique({
        where: { id: quizId },
        include: { questions: { orderBy: { order: 'asc' } } },
      });
      if (!quiz || !quiz.published) {
        throw new AppException(HttpStatus.NOT_FOUND, 'QUIZ_NOT_FOUND', 'Quiz not found');
      }
      if (quiz.questions.length === 0) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'QUIZ_HAS_NO_QUESTIONS',
          'This quiz has no questions',
        );
      }

      const attempt = await tx.attempt.create({
        data: {
          userId,
          quizId,
          stakeAmount: quiz.stake,
          status: 'IN_PROGRESS',
        },
      });

      const ledger = await applyLedger(tx, {
        userId,
        type: TransactionType.STAKE,
        amount: -quiz.stake,
        idempotencyKey: `stake:${attempt.id}`,
        referenceType: 'attempt',
        referenceId: attempt.id,
      });

      return {
        id: attempt.id,
        status: attempt.status,
        stakeAmount: attempt.stakeAmount,
        score: null,
        passed: null,
        rewardAmount: null,
        accountBalance: ledger.balance,
        quiz: quizCard(quiz),
        questions: quiz.questions.map((question) => publicQuestion(question)),
      };
    });
  }

  async submit(userId: string, attemptId: string, dto: SubmitAttemptDto): Promise<SettledAttemptResponse> {
    return this.prisma.$transaction(async (tx) => {
      const attempt = await lockAttempt(tx, attemptId);
      if (attempt.userId !== userId) {
        throw new AppException(
          HttpStatus.FORBIDDEN,
          'ATTEMPT_FORBIDDEN',
          'This attempt belongs to another player',
        );
      }
      if (attempt.status !== 'IN_PROGRESS') {
        throw new AppException(
          HttpStatus.CONFLICT,
          'ALREADY_SETTLED',
          'This attempt has already been submitted',
        );
      }

      const quiz = await tx.quiz.findUnique({
        where: { id: attempt.quizId },
        include: { questions: { orderBy: { order: 'asc' } } },
      });
      if (!quiz) {
        throw new AppException(HttpStatus.NOT_FOUND, 'QUIZ_NOT_FOUND', 'Quiz not found');
      }

      assertAnswers(quiz.questions, dto);
      const correct = dto.answers.filter((answer) => {
        const question = quiz.questions.find((item) => item.id === answer.questionId);
        return question?.correctIndex === answer.selectedIndex;
      }).length;
      const score = Math.round((correct / quiz.questions.length) * 100);
      const passed = score >= quiz.passMark;
      const rewardAmount = passed ? quiz.reward : 0;

      const settled = await tx.attempt.updateMany({
        where: { id: attemptId, status: 'IN_PROGRESS' },
        data: {
          status: 'SETTLED',
          score,
          passed,
          rewardAmount,
          submittedAt: new Date(),
        },
      });
      if (settled.count !== 1) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'ALREADY_SETTLED',
          'This attempt has already been submitted',
        );
      }

      await tx.attemptAnswer.createMany({
        data: dto.answers.map((answer) => ({
          attemptId,
          questionId: answer.questionId,
          selectedIndex: answer.selectedIndex,
        })),
      });

      let accountBalance: number;
      if (passed) {
        const ledger = await applyLedger(tx, {
          userId,
          type: TransactionType.QUIZ_REWARD,
          amount: quiz.reward,
          idempotencyKey: `reward:${attemptId}`,
          referenceType: 'attempt',
          referenceId: attemptId,
        });
        accountBalance = ledger.balance;
      } else {
        accountBalance = (await lockAccount(tx, userId)).balance;
      }

      return {
        id: attemptId,
        status: AttemptStatus.SETTLED,
        stakeAmount: attempt.stakeAmount,
        score,
        passed,
        rewardAmount,
        accountBalance,
        quiz: quizCard(quiz),
        questions: quiz.questions.map((question) =>
          publicQuestion(question, {
            reveal: true,
            selectedIndex: dto.answers.find((answer) => answer.questionId === question.id)?.selectedIndex ?? null,
          }),
        ),
      };
    });
  }

  async list(userId: string): Promise<ApiListResponse<AttemptListItemResponse>> {
    const attempts = await this.prisma.attempt.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      include: { quiz: true },
    });
    return {
      items: attempts.map((attempt) => ({
        id: attempt.id,
        status: attempt.status,
        stakeAmount: attempt.stakeAmount,
        score: attempt.score,
        passed: attempt.passed,
        rewardAmount: attempt.rewardAmount,
        startedAt: attempt.startedAt.toISOString(),
        submittedAt: attempt.submittedAt?.toISOString() ?? null,
        quiz: {
          id: attempt.quiz.id,
          title: attempt.quiz.title,
        },
      })),
    };
  }

  async get(userId: string, attemptId: string): Promise<AttemptDetailResponse> {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: { include: { questions: { orderBy: { order: 'asc' } } } },
        answers: true,
        user: { include: { creditAccount: true } },
      },
    });
    if (!attempt) {
      throw new AppException(HttpStatus.NOT_FOUND, 'ATTEMPT_NOT_FOUND', 'Attempt not found');
    }
    if (attempt.userId !== userId) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        'ATTEMPT_FORBIDDEN',
        'This attempt belongs to another player',
      );
    }
    const reveal = attempt.status === 'SETTLED';
    return {
      id: attempt.id,
      status: attempt.status,
      stakeAmount: attempt.stakeAmount,
      score: attempt.score,
      passed: attempt.passed,
      rewardAmount: attempt.rewardAmount,
      accountBalance: attempt.user.creditAccount?.balance ?? 0,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      quiz: quizCard(attempt.quiz),
      questions: attempt.quiz.questions.map((question) =>
        publicQuestion(question, {
          reveal,
          selectedIndex: attempt.answers.find((answer) => answer.questionId === question.id)?.selectedIndex ?? null,
        }),
      ),
    };
  }
}

async function lockAttempt(tx: TransactionClient, attemptId: string): Promise<LockedAttempt> {
  const rows = await tx.$queryRawUnsafe<LockedAttempt[]>(
    `SELECT id::text AS id,
            status::text AS status,
            user_id::text AS "userId",
            quiz_id::text AS "quizId",
            stake_amount AS "stakeAmount"
     FROM attempts
     WHERE id = $1::uuid
     FOR UPDATE`,
    attemptId,
  );
  const attempt = rows[0];
  if (!attempt) {
    throw new AppException(HttpStatus.NOT_FOUND, 'ATTEMPT_NOT_FOUND', 'Attempt not found');
  }
  return { ...attempt, stakeAmount: Number(attempt.stakeAmount) };
}

function assertAnswers(questions: Question[], dto: SubmitAttemptDto) {
  if (dto.answers.length !== questions.length) {
    throw new AppException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'INVALID_ANSWERS',
      'Submit one answer for every question',
    );
  }
  const seen = new Set<string>();
  for (const answer of dto.answers) {
    const question = questions.find((item) => item.id === answer.questionId);
    if (!question || seen.has(answer.questionId)) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'INVALID_ANSWERS',
        'Answers must cover each question once',
      );
    }
    seen.add(answer.questionId);
    if (answer.selectedIndex >= asOptions(question.options).length) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'INVALID_ANSWERS',
        'Selected option is out of range',
      );
    }
  }
}

function quizCard(quiz: {
  id: string;
  title: string;
  stake: number;
  reward: number;
  passMark: number;
}): AttemptQuizResponse {
  return {
    id: quiz.id,
    title: quiz.title,
    stake: quiz.stake,
    reward: quiz.reward,
    passMark: quiz.passMark,
  };
}

function publicQuestion(
  question: Question,
  extras?: { reveal?: boolean; selectedIndex?: number | null },
): AttemptQuestionResponse {
  return {
    id: question.id,
    prompt: question.prompt,
    options: asOptions(question.options),
    order: question.order,
    ...(extras?.reveal ? { correctIndex: question.correctIndex } : {}),
    ...(extras ? { selectedIndex: extras.selectedIndex ?? null } : {}),
  };
}
