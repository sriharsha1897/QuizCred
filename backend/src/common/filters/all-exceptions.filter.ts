import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Response } from 'express';
import { mapPrismaError } from '../errors/map-prisma-error';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof PrismaClientKnownRequestError) {
      const mapped = mapPrismaError(exception);
      if (mapped) {
        response.status(mapped.statusCode).json(mapped);
        return;
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'object' && body !== null && 'code' in body) {
        const payload = body as { statusCode?: number; code: string; message?: string };
        response.status(status).json({
          statusCode: payload.statusCode ?? status,
          code: payload.code,
          message: payload.message ?? defaultMessageForStatus(status),
        });
        return;
      }
      const raw =
        typeof body === 'string'
          ? body
          : (body as { message?: string | string[] }).message;
      const message = Array.isArray(raw) ? raw.join('; ') : raw ?? exception.message;
      response.status(status).json({
        statusCode: status,
        code: codeForStatus(status),
        message: message || defaultMessageForStatus(status),
      });
      return;
    }

    console.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong on our side. Try again in a moment.',
    });
  }
}

function codeForStatus(status: number): string {
  if (status === HttpStatus.UNAUTHORIZED) return 'UNAUTHORIZED';
  if (status === HttpStatus.FORBIDDEN) return 'FORBIDDEN';
  if (status === HttpStatus.NOT_FOUND) return 'NOT_FOUND';
  if (status === HttpStatus.CONFLICT) return 'CONFLICT';
  if (status === HttpStatus.UNPROCESSABLE_ENTITY) return 'VALIDATION_ERROR';
  return 'HTTP_ERROR';
}

function defaultMessageForStatus(status: number): string {
  if (status === HttpStatus.UNAUTHORIZED) return 'Sign in to continue';
  if (status === HttpStatus.FORBIDDEN) return 'You do not have access to this resource';
  if (status === HttpStatus.NOT_FOUND) return 'The requested resource was not found';
  if (status === HttpStatus.CONFLICT) return 'This action conflicts with the current state';
  if (status === HttpStatus.UNPROCESSABLE_ENTITY) return 'Check the request and try again';
  return 'Request failed';
}
