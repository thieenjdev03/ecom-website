import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from './enums/role.enum';

describe('RolesGuard', () => {
  const buildContext = (req: any): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  const guardWithRoles = (roles: Role[] | undefined) => {
    const reflector = { getAllAndOverride: () => roles } as unknown as Reflector;
    return new RolesGuard(reflector);
  };

  it('cho qua khi handler không yêu cầu role', () => {
    const guard = guardWithRoles(undefined);
    expect(guard.canActivate(buildContext({ method: 'GET', originalUrl: '/users' }))).toBe(true);
  });

  it('từ chối request không có user dù NODE_ENV là development (không còn bypass GET /users)', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const guard = guardWithRoles([Role.ADMIN]);
    expect(() =>
      guard.canActivate(buildContext({ method: 'GET', originalUrl: '/users' })),
    ).toThrow(ForbiddenException);
    process.env.NODE_ENV = originalEnv;
  });

  it('từ chối user không đúng role', () => {
    const guard = guardWithRoles([Role.ADMIN]);
    expect(() =>
      guard.canActivate(buildContext({ user: { userId: '1', role: Role.USER, ver: 1 } })),
    ).toThrow(ForbiddenException);
  });

  it('cho qua khi user đúng role', () => {
    const guard = guardWithRoles([Role.ADMIN]);
    expect(
      guard.canActivate(buildContext({ user: { userId: '1', role: Role.ADMIN, ver: 1 } })),
    ).toBe(true);
  });
});
