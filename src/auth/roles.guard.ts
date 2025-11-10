// src/auth/roles.guard.ts
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from './enums/role.enum';

type JwtUser = { userId: string; role: Role; ver: number; twofa?: boolean };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{ user?: JwtUser; method?: string; originalUrl?: string; path?: string }>();

    // Bypass ở local cho GET /users
    const isProduction = (process.env.NODE_ENV || 'development') === 'production';
    if (!isProduction) {
      const urlPath = (req.originalUrl || req.path || '').split('?')[0];
      const isGetAllUsers = req.method === 'GET' && urlPath === '/users';
      if (isGetAllUsers) return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // Không yêu cầu role -> cho qua
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // LẤY USER ĐÚNG CHỖ
    const user = req.user; // <-- JwtAuthGuard/Passport gắn ở đây
    if (!user) {
      // Thường là thiếu JwtAuthGuard chạy trước RolesGuard
      throw new ForbiddenException('You are not authenticated or your token is invalid. Please login to continue.');
    }

    if (!requiredRoles.includes(user.role)) {
      const rolesText = requiredRoles.join(' or ');
      throw new ForbiddenException(`You do not have permission to access this resource. Required role: ${rolesText}.`);
    }
    return true;
  }
}