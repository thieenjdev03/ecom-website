import { Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';

// Fallback filter to catch non-HttpExceptions (e.g., unexpected errors)
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Default 500 for unknown errors
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException ? exception.message : 'Internal server error';
    const name = exception instanceof Error ? exception.name : 'Error';

    // Log stack for diagnostics (not returned to client)
    if (exception instanceof Error) {
      this.logger.error(`${name}: ${message}`, exception.stack);
    } else {
      this.logger.error(`Unknown exception: ${JSON.stringify(exception)}`);
    }

    const payload = {
      statusCode: status,
      error: name,
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(payload);
  }
}


