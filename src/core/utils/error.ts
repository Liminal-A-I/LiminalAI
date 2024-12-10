import { AIErrorType, AIError } from '../models/types';
import { Logger } from '../services/Logger';

const logger = Logger.getInstance('ErrorHandler');

/**
 * Error codes for different types of errors
 */
export enum ErrorCode {
  // Validation Errors (400-499)
  INVALID_INPUT = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  RATE_LIMITED = 429,

  // Server Errors (500-599)
  INTERNAL_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
  TIMEOUT = 504,

  // Business Logic Errors (600-699)
  DESIGN_GENERATION_FAILED = 600,
  EXPORT_FAILED = 601,
  STORAGE_ERROR = 602,

  // External Service Errors (700-799)
  AI_SERVICE_ERROR = 700,
  CLOUDFLARE_ERROR = 701,
  DATABASE_ERROR = 702,
}

/**
 * Base error class for application errors
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        type: ErrorCode[this.code],
        message: this.message,
        details: this.details,
      },
    };
  }
}

/**
 * Error handler utility functions
 */
export const ErrorHandler = {
  /**
   * Handle errors and convert to appropriate type
   */
  handle(error: unknown): AppError {
    // Already handled errors
    if (error instanceof AppError) {
      return error;
    }

    // AI-specific errors
    if (error instanceof AIError) {
      return new AppError(
        ErrorCode.AI_SERVICE_ERROR,
        error.message,
        { type: error.type, details: error.details }
      );
    }

    // Generic error handling
    const genericError = error instanceof Error ? error : new Error(String(error));
    logger.error('Unhandled error:', genericError);

    return new AppError(
      ErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred',
      { originalError: genericError.message }
    );
  },

  /**
   * Create validation error
   */
  validation(message: string, details?: Record<string, any>): AppError {
    return new AppError(ErrorCode.INVALID_INPUT, message, details);
  },

  /**
   * Create not found error
   */
  notFound(resource: string, id?: string): AppError {
    return new AppError(
      ErrorCode.NOT_FOUND,
      `${resource} not found${id ? `: ${id}` : ''}`,
      { resource, id }
    );
  },

  /**
   * Create unauthorized error
   */
  unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(ErrorCode.UNAUTHORIZED, message);
  },

  /**
   * Create forbidden error
   */
  forbidden(message = 'Forbidden'): AppError {
    return new AppError(ErrorCode.FORBIDDEN, message);
  },

  /**
   * Create rate limit error
   */
  rateLimit(details?: Record<string, any>): AppError {
    return new AppError(
      ErrorCode.RATE_LIMITED,
      'Too many requests',
      details
    );
  },

  /**
   * Create timeout error
   */
  timeout(operation: string, details?: Record<string, any>): AppError {
    return new AppError(
      ErrorCode.TIMEOUT,
      `Operation timed out: ${operation}`,
      details
    );
  },

  /**
   * Create service unavailable error
   */
  serviceUnavailable(service: string, details?: Record<string, any>): AppError {
    return new AppError(
      ErrorCode.SERVICE_UNAVAILABLE,
      `Service unavailable: ${service}`,
      details
    );
  },

  /**
   * Convert error to API response
   */
  toResponse(error: unknown) {
    const appError = this.handle(error);
    return {
      status: Math.floor(appError.code / 100),
      body: appError.toJSON(),
    };
  },
}; 