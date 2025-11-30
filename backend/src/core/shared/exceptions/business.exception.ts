/**
 * Base exception for business logic errors
 */
export class BusinessException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'BusinessException';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Exception for invalid input data
 */
export class ValidationException extends BusinessException {
  constructor(
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationException';
  }
}

/**
 * Exception for resource not found
 */
export class NotFoundException extends BusinessException {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} with id ${id} not found` : `${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundException';
  }
}

/**
 * Exception for AI provider errors
 */
export class AiProviderException extends BusinessException {
  constructor(
    message: string,
    public readonly originalError?: Error,
  ) {
    super(message, 'AI_PROVIDER_ERROR', 503);
    this.name = 'AiProviderException';
  }
}
