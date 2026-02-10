import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_ADMIN_KEY } from '../decorators/is-admin.decorator';
import { IS_SUPER_USER_KEY } from '../decorators/is-super-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/is-public.decorator';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const isAdminRequired = this.reflector.get<boolean>(
      IS_ADMIN_KEY,
      context.getHandler(),
    );

    const isSuperUserRequired = this.reflector.get<boolean>(
      IS_SUPER_USER_KEY,
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    if (isAdminRequired && isSuperUserRequired) {
      return user.isAdmin || user.isSuperUser;
    }

    if (isSuperUserRequired) {
      return user.isSuperUser;
    }
    if (isAdminRequired) {
      return user.isAdmin;
    }

    return true;
  }
}
