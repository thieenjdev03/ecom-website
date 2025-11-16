import { Catch, ArgumentsHost, HttpException, HttpStatus, Logger, BadRequestException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';

// Enhanced filter to catch all exceptions with better error handling
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] = [];
    let errorName = 'Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        
        // Handle validation errors specifically
        if (exception instanceof BadRequestException) {
          if (Array.isArray(responseObj.message)) {
            errors = responseObj.message;
            message = 'Validation failed';
          } else if (typeof responseObj.message === 'string') {
            message = responseObj.message;
          }
        }
      } else {
        message = exceptionResponse as string;
      }
      errorName = exception.constructor.name;
    } else if (exception instanceof Error) {
      message = exception.message;
      errorName = exception.constructor.name;
      
      // Handle specific error types
      if (exception.message.includes('validation')) {
        status = HttpStatus.BAD_REQUEST;
        message = 'Validation failed';
      } else if (exception.message.includes('authentication')) {
        status = HttpStatus.UNAUTHORIZED;
        message = 'Authentication failed';
      } else if (exception.message.includes('network') || exception.message.includes('timeout')) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Service temporarily unavailable';
      }
    }

    // Skip logging for HEAD /health requests (to avoid log spam from uptime monitors)
    const isHeadHealth = request.method === 'HEAD' && request.url?.split('?')[0] === '/health';
    
    // Log error for debugging (skip HEAD /health to avoid spam)
    if (!isHeadHealth) {
      this.logger.error(`API Error [${status}]: ${message}`, {
        path: request.url,
        method: request.method,
        body: request.body,
        query: request.query,
        params: request.params,
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    }

    const payload = {
      success: false,
      statusCode: status,
      error: errorName,
      message,
      ...(errors.length > 0 && { errors }),
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    response.status(status).json(payload);
  }
}