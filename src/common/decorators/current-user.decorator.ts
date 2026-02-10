import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUser } from '../../modules/auth/interfaces/jwt-user.interface';

export const AuthUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtUser;
  },
);
