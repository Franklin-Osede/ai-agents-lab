import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { BusinessException, ValidationException } from '../exceptions/business.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let errors: Record<string, unknown> | undefined;

    if (exception instanceof BusinessException) {
      status = exception.statusCode;
      message = exception.message;
      code = exception.code;
      if (exception instanceof ValidationException) {
        errors = exception.errors;
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as {
          message?: string;
          errors?: Record<string, unknown>;
        };
        message = responseObj.message || message;
        errors = responseObj.errors;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    } else {
      message = 'An unexpected error occurred';
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      code,
      message,
      ...(errors && { errors }),
    };

    response.status(status).json(errorResponse);
  }
}
