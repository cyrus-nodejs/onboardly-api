import {
  CanActivate,
  ExecutionContext,
  Injectable,
  forwardRef,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from '../../common/decorators/is-public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest();

    let token: string | undefined;

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === 'string') {
      const [type, value] = authHeader.split(' ');
      if (type !== 'Bearer' || !value) {
        throw new UnauthorizedException('Invalid authorization header');
      }
      token = value;
    }

    if (!token && req.cookies?.access_token) {
      token = req.cookies.access_token;
    }
    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }
    const payload = await this.authService.validateToken(token);

    req.user = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      isAdmin: payload.isAdmin,
      isSuperUser: payload.isSuperUser,
      organisationId: payload.organisationId,
    };

    return true;
  }
}
