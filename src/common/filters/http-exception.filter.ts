import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Try to normalize message and errors from Nest/ValidationPipe/Custom exceptions
    const exceptionResponse = exception.getResponse() as
      | string
      | {
          message?: string | string[];
          error?: string;
          statusCode?: number;
          [key: string]: any;
        };

    const messages = Array.isArray((exceptionResponse as any)?.message)
      ? (exceptionResponse as any).message
      : typeof (exceptionResponse as any)?.message === 'string'
        ? [(exceptionResponse as any).message]
        : exception.message
          ? [exception.message]
          : [];

    const errorName = (exceptionResponse as any)?.error || exception.name || 'Error';

    const payload = {
      statusCode: status,
      error: errorName,
      message: messages.length === 1 ? messages[0] : 'Validation or request error',
      errors: messages.length > 1 ? messages : undefined,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    };

    // Minimal logging without sensitive data
    this.logger.warn({
      status,
      error: errorName,
      path: request.url,
      method: request.method,
      messages,
    });

    response.status(status).json(payload);
  }
}
