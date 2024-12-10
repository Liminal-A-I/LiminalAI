import { env } from '../../config/config';

/**
 * Log levels for different types of messages
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * Interface for log entries
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  error?: Error;
}

/**
 * Logger service for application-wide logging and monitoring
 * @example
 * const logger = new Logger('AuthService');
 * logger.info('User logged in', { userId: '123' });
 */
export class Logger {
  private context: string;
  private static instance: Logger;

  constructor(context: string) {
    this.context = context;
  }

  /**
   * Get singleton instance of logger
   */
  public static getInstance(context: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(context);
    }
    return Logger.instance;
  }

  /**
   * Format log entry for output
   */
  private formatLog(level: LogLevel, message: string, data?: any, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      data,
      error
    };
  }

  /**
   * Send log to appropriate destination based on environment
   */
  private async sendLog(entry: LogEntry): Promise<void> {
    // Format for console output
    const consoleMessage = `[${entry.timestamp}] ${entry.level} [${entry.context}] ${entry.message}`;
    
    switch (env.NODE_ENV) {
      case 'development':
        // Pretty print in development
        console.log(consoleMessage);
        if (entry.data) console.log('Data:', entry.data);
        if (entry.error) console.error('Error:', entry.error);
        break;

      case 'production':
        // In production, send to logging service and monitoring
        try {
          // TODO: Implement production logging service integration
          // Example: await LoggingService.send(entry);
          
          // Send metrics if error
          if (entry.level === LogLevel.ERROR) {
            // TODO: Implement error monitoring service integration
            // Example: await ErrorMonitoring.capture(entry);
          }
        } catch (err) {
          // Fallback to console in case of logging service failure
          console.error('Logging service failed:', err);
          console.error(entry);
        }
        break;

      case 'test':
        // Suppress logs in test environment unless explicitly enabled
        if (env.ENABLE_TEST_LOGS) {
          console.log(consoleMessage);
        }
        break;
    }
  }

  /**
   * Log debug message
   */
  public debug(message: string, data?: any): void {
    this.sendLog(this.formatLog(LogLevel.DEBUG, message, data));
  }

  /**
   * Log info message
   */
  public info(message: string, data?: any): void {
    this.sendLog(this.formatLog(LogLevel.INFO, message, data));
  }

  /**
   * Log warning message
   */
  public warn(message: string, data?: any): void {
    this.sendLog(this.formatLog(LogLevel.WARN, message, data));
  }

  /**
   * Log error message
   */
  public error(message: string, error?: Error, data?: any): void {
    this.sendLog(this.formatLog(LogLevel.ERROR, message, data, error));
  }

  /**
   * Log performance metrics
   */
  public metric(name: string, value: number, tags?: Record<string, string>): void {
    this.info(`Metric: ${name}`, { value, tags });
    // TODO: Implement metrics service integration
    // Example: await MetricsService.record(name, value, tags);
  }

  /**
   * Start performance measurement
   */
  public startTimer(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.metric(`timer.${label}`, duration);
    };
  }
} 