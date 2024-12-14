type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorDetails {
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  timestamp: Date;
}

export class ErrorLogging {
  private static instance: ErrorLogging;
  private errors: ErrorDetails[] = [];

  private constructor() {}

  static getInstance(): ErrorLogging {
    if (!ErrorLogging.instance) {
      ErrorLogging.instance = new ErrorLogging();
    }
    return ErrorLogging.instance;
  }

  logError(error: Error, severity: ErrorSeverity = 'medium', context?: Record<string, any>) {
    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      severity,
      context,
      timestamp: new Date()
    };

    this.errors.push(errorDetails);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorDetails);
    }

    // TODO: Send to error tracking service
  }

  getRecentErrors(count: number = 10): ErrorDetails[] {
    return this.errors.slice(-count);
  }
} 