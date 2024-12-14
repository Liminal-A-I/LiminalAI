import { ErrorLogging } from './ErrorLogging';
import { Logger } from './Logger';

interface ErrorMetrics {
  count: number;
  lastOccurred: Date;
  firstOccurred: Date;
  occurrences: number[];
}

export class ErrorMonitoring {
  private static instance: ErrorMonitoring;
  private metrics: Map<string, ErrorMetrics> = new Map();
  private logger: Logger;
  private errorLogging: ErrorLogging;

  private constructor() {
    this.logger = Logger.getInstance('ErrorMonitoring');
    this.errorLogging = ErrorLogging.getInstance();
  }

  static getInstance(): ErrorMonitoring {
    if (!ErrorMonitoring.instance) {
      ErrorMonitoring.instance = new ErrorMonitoring();
    }
    return ErrorMonitoring.instance;
  }

  trackError(error: Error, component?: string): void {
    const errorKey = this.getErrorKey(error, component);
    const currentMetrics = this.metrics.get(errorKey) || {
      count: 0,
      lastOccurred: new Date(),
      firstOccurred: new Date(),
      occurrences: []
    };

    currentMetrics.count++;
    currentMetrics.lastOccurred = new Date();
    currentMetrics.occurrences.push(Date.now());

    // Keep only last 100 occurrences
    if (currentMetrics.occurrences.length > 100) {
      currentMetrics.occurrences.shift();
    }

    this.metrics.set(errorKey, currentMetrics);

    // Log error if it's occurring frequently
    if (this.isErrorSpike(currentMetrics)) {
      this.logger.warn('Error spike detected', {
        error: error.message,
        component,
        metrics: currentMetrics
      });
    }

    // Forward to error logging service
    this.errorLogging.logError(error, this.determineErrorSeverity(currentMetrics));
  }

  private getErrorKey(error: Error, component?: string): string {
    return `${component || 'global'}-${error.name}-${error.message}`;
  }

  private isErrorSpike(metrics: ErrorMetrics): boolean {
    const recentOccurrences = metrics.occurrences.filter(
      timestamp => Date.now() - timestamp < 300000 // Last 5 minutes
    );
    return recentOccurrences.length >= 10;
  }

  private determineErrorSeverity(metrics: ErrorMetrics): 'low' | 'medium' | 'high' | 'critical' {
    if (metrics.count >= 100) return 'critical';
    if (metrics.count >= 50) return 'high';
    if (metrics.count >= 10) return 'medium';
    return 'low';
  }

  getMetrics(): Map<string, ErrorMetrics> {
    return new Map(this.metrics);
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
} 