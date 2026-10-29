import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from '../decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AppException } from '../errors/app.exception';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser = AuthUser>(
    err: unknown,
    user: TUser | false,
    info: Error | undefined,
  ): TUser {
    if (err instanceof AppException) {
      throw err;
    }
    if (err) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHORIZED',
        'Your session is invalid. Sign in again.',
      );
    }
    if (!user) {
      const detail = info?.message?.toLowerCase() ?? '';
      const message = detail.includes('jwt expired')
        ? 'Your session expired. Sign in again.'
        : detail.includes('no auth token') || detail.includes('missing')
          ? 'Sign in to continue'
          : 'Sign in to continue';
      throw new AppException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', message);
    }
    return user;
  }
}
