import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { auditContext } from './audit-context';

@Injectable()
export class AuditContextMiddleware implements NestMiddleware {
  use(request: Request, _response: Response, next: NextFunction) {
    auditContext.run(
      {
        request,
        ip: request.ip ?? null,
        userAgent: request.get('user-agent') ?? null,
      },
      next,
    );
  }
}
