import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { getPermissionsForRole } from '../permissions/role-permissions';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    if (!payload?.sub || !payload?.email || !payload?.role) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const normalizedRole = payload.role.toLowerCase();

    return {
      sub: payload.sub,
      email: payload.email,
      role: normalizedRole,
      companyId: payload.companyId ?? null,
      permissions: getPermissionsForRole(normalizedRole),
      moduleAccess: payload.moduleAccess ?? [],
    };
  }
}
