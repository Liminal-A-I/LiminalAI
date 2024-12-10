import { env, constants } from '../../config/config';
import { Logger } from '../services/Logger';
import { ErrorCode } from './error';

const logger = Logger.getInstance('Monitoring');

/**
 * Metric types for different measurements
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
}

/**
 * Metric labels for categorization
 */
export interface MetricLabels {
  service?: string;
  operation?: string;
  status?: string;
  endpoint?: string;
  [key: string]: string | undefined;
}

/**
 * Metric value types
 */
export type MetricValue = number;

/**
 * Metric definition
 */
export interface Metric {
  name: string;
  type: MetricType;
  value: MetricValue;
  labels?: MetricLabels;
  timestamp?: number;
}

/**
 * System health status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

/**
 * Health check result
 */
export interface HealthCheck {
  status: HealthStatus;
  checks: {
    [service: string]: {
      status: HealthStatus;
      latency?: number;
      message?: string;
      lastCheck: Date;
    };
  };
}

/**
 * Monitoring service for metrics and health checks
 */
export class Monitoring {
  private static instance: Monitoring;
  private metrics: Map<string, Metric>;
  private healthStatus: HealthCheck;

  private constructor() {
    this.metrics = new Map();
    this.healthStatus = {
      status: HealthStatus.HEALTHY,
      checks: {},
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): Monitoring {
    if (!Monitoring.instance) {
      Monitoring.instance = new Monitoring();
    }
    return Monitoring.instance;
  }

  /**
   * Record a metric
   */
  public recordMetric(metric: Metric): void {
    if (!env.ENABLE_METRICS) return;

    try {
      const key = this.getMetricKey(metric);
      this.metrics.set(key, {
        ...metric,
        timestamp: Date.now(),
      });

      // Log metric for development
      if (env.NODE_ENV === 'development') {
        logger.debug('Metric recorded', { metric });
      }

      // TODO: Implement metrics storage/export
      // Example: Send to Prometheus/Grafana
    } catch (error) {
      logger.error('Failed to record metric', error as Error);
    }
  }

  /**
   * Increment a counter metric
   */
  public incrementCounter(name: string, labels?: MetricLabels): void {
    const existing = this.getMetric(name, labels);
    this.recordMetric({
      name,
      type: MetricType.COUNTER,
      value: (existing?.value || 0) + 1,
      labels,
    });
  }

  /**
   * Set a gauge metric
   */
  public setGauge(name: string, value: number, labels?: MetricLabels): void {
    this.recordMetric({
      name,
      type: MetricType.GAUGE,
      value,
      labels,
    });
  }

  /**
   * Record a histogram value
   */
  public recordHistogram(name: string, value: number, labels?: MetricLabels): void {
    this.recordMetric({
      name,
      type: MetricType.HISTOGRAM,
      value,
      labels,
    });
  }

  /**
   * Start timing an operation
   */
  public startTimer(name: string, labels?: MetricLabels): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordHistogram(name, duration, labels);
    };
  }

  /**
   * Update health check status
   */
  public updateHealth(
    service: string,
    status: HealthStatus,
    details?: { latency?: number; message?: string }
  ): void {
    this.healthStatus.checks[service] = {
      status,
      latency: details?.latency,
      message: details?.message,
      lastCheck: new Date(),
    };

    // Update overall status
    const statuses = Object.values(this.healthStatus.checks).map(c => c.status);
    if (statuses.includes(HealthStatus.UNHEALTHY)) {
      this.healthStatus.status = HealthStatus.UNHEALTHY;
    } else if (statuses.includes(HealthStatus.DEGRADED)) {
      this.healthStatus.status = HealthStatus.DEGRADED;
    } else {
      this.healthStatus.status = HealthStatus.HEALTHY;
    }

    // Log health status changes
    logger.info('Health status updated', {
      service,
      status,
      details,
      overall: this.healthStatus.status,
    });
  }

  /**
   * Get current health status
   */
  public getHealth(): HealthCheck {
    return this.healthStatus;
  }

  /**
   * Get all metrics
   */
  public getMetrics(): Map<string, Metric> {
    return new Map(this.metrics);
  }

  /**
   * Clear old metrics
   */
  public clearOldMetrics(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    for (const [key, metric] of this.metrics.entries()) {
      if (metric.timestamp && now - metric.timestamp > maxAgeMs) {
        this.metrics.delete(key);
      }
    }
  }

  /**
   * Get a specific metric
   */
  private getMetric(name: string, labels?: MetricLabels): Metric | undefined {
    return this.metrics.get(this.getMetricKey({ name, type: MetricType.COUNTER, value: 0, labels }));
  }

  /**
   * Generate unique key for a metric
   */
  private getMetricKey(metric: Metric): string {
    const labelString = metric.labels
      ? Object.entries(metric.labels)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}="${v}"`)
          .join(',')
      : '';
    return `${constants.METRICS_PREFIX}${metric.name}{${labelString}}`;
  }
}

// Export singleton instance
export const monitoring = Monitoring.getInstance(); 