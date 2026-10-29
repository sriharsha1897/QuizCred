import { HttpException, HttpStatus, ValidationError, ValidationPipe } from '@nestjs/common';

export function flattenValidation(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    if (error.constraints) messages.push(...Object.values(error.constraints));
    if (error.children?.length) messages.push(...flattenValidation(error.children));
  }
  return messages;
}

export function createValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => {
      const messages = flattenValidation(errors);
      return new HttpException(
        {
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          code: 'VALIDATION_ERROR',
          message: messages.join('; ') || 'Check the highlighted fields and try again',
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    },
  });
}
