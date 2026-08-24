import { AsyncLocalStorage } from 'node:async_hooks';
import { Request } from 'express';

export interface AuditRequestContext {
  request: Request;
  ip: string | null;
  userAgent: string | null;
}

export const auditContext = new AsyncLocalStorage<AuditRequestContext>();

export function getAuditContext() {
  const context = auditContext.getStore();
  const user = (context?.request as Request & { user?: { sub?: string; userId?: string } })?.user;

  return {
    userId: user?.sub ?? user?.userId ?? null,
    ip: context?.ip ?? null,
    userAgent: context?.userAgent ?? null,
  };
}
