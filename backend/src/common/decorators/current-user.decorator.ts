import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUserResponse } from '../api';

export type AuthUser = AuthUserResponse;

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
