import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { ApiSuccessResponse } from '../api';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponse<unknown>> {
    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'OK';

    return next.handle().pipe(
      map((data) => {
        if (isSuccessEnvelope(data)) {
          return data;
        }
        return { message, data };
      }),
    );
  }
}

function isSuccessEnvelope(value: unknown): value is ApiSuccessResponse<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    'data' in value &&
    typeof (value as ApiSuccessResponse<unknown>).message === 'string'
  );
}
