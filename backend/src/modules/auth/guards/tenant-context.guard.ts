import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class TenantContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Missing authenticated user context');
    }

    const normalizedRole = user.role.toLowerCase();
    const isSystemRole = normalizedRole === 'admin' || normalizedRole === 'system_admin';

    if (!isSystemRole && !user.companyId) {
      throw new ForbiddenException('Tenant user must be assigned to a company');
    }

    return true;
  }
}
