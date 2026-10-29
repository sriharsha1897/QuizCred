import { HttpStatus } from '@nestjs/common';
import { JsonValue } from '../prisma/types';
import { AppException } from './errors/app.exception';

export function asOptions(value: JsonValue): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) return [];
  return value;
}

export function assertQuestionShape(input: { options: string[]; correctIndex: number }) {
  if (input.correctIndex >= input.options.length) {
    throw new AppException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'VALIDATION_ERROR',
      'correctIndex must point at one of the options',
    );
  }
}
