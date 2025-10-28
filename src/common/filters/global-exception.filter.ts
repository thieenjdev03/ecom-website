import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        
        // Handle validation errors
        if (exception instanceof BadRequestException) {
          const responseBody = exception.getResponse() as any;
          if (responseBody.message && Array.isArray(responseBody.message)) {
            errors = responseBody.message;
            message = 'Validation failed';
          }
        }
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      
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

    const errorResponse = {
      success: false,
      message,
      ...(errors.length > 0 && { errors }),
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // Log error for debugging
    console.error('API Error:', {
      status,
      message,
      errors,
      path: request.url,
      method: request.method,
      body: request.body,
      exception: exception instanceof Error ? exception.stack : exception,
    });

    response.status(status).json(errorResponse);
  }
}
