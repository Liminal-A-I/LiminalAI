import { NextResponse } from 'next/server';
import { monitoring, MetricType } from '@/src/core/utils/monitoring';
import { ErrorHandler } from '@/src/core/utils/error';
import { env } from '@/src/config/config';

/**
 * Metrics endpoint
 * GET /api/metrics
 */
export async function GET() {
  try {
    if (!env.ENABLE_METRICS) {
      return NextResponse.json({ error: 'Metrics are disabled' }, { status: 404 });
    }

    // Get all metrics
    const metrics = monitoring.getMetrics();
    
    // Convert to Prometheus format
    const prometheusMetrics = convertToPrometheusFormat(metrics);

    return new NextResponse(prometheusMetrics, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
      },
    });
  } catch (error) {
    const { status, body } = ErrorHandler.toResponse(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * Convert metrics to Prometheus format
 */
function convertToPrometheusFormat(metrics: Map<string, any>): string {
  const lines: string[] = [];
  const now = Date.now();

  // Clean up old metrics
  monitoring.clearOldMetrics();

  // Group metrics by name for TYPE and HELP comments
  const metricsByName = new Map<string, any[]>();
  
  for (const [key, metric] of metrics.entries()) {
    const name = metric.name;
    const existing = metricsByName.get(name) || [];
    existing.push(metric);
    metricsByName.set(name, existing);
  }

  // Generate Prometheus format
  for (const [name, metrics] of metricsByName.entries()) {
    // Add TYPE comment
    const type = metrics[0].type.toLowerCase();
    lines.push(`# TYPE ${name} ${type}`);

    // Add HELP comment (if we had descriptions)
    // lines.push(`# HELP ${name} ${description}`);

    // Add metric values
    for (const metric of metrics) {
      const labels = metric.labels
        ? '{' + Object.entries(metric.labels)
            .map(([k, v]) => `${k}="${v}"`)
            .join(',') + '}'
        : '';
      
      switch (metric.type) {
        case MetricType.COUNTER:
        case MetricType.GAUGE:
          lines.push(`${name}${labels} ${metric.value} ${metric.timestamp || now}`);
          break;
          
        case MetricType.HISTOGRAM:
          // For histograms, we should add _bucket, _sum, and _count metrics
          // This is a simplified version
          lines.push(`${name}_sum${labels} ${metric.value} ${metric.timestamp || now}`);
          lines.push(`${name}_count${labels} 1 ${metric.timestamp || now}`);
          break;
      }
    }

    // Add empty line between metrics
    lines.push('');
  }

  // Add some default metrics
  addDefaultMetrics(lines);

  return lines.join('\n');
}

/**
 * Add default system metrics
 */
function addDefaultMetrics(lines: string[]): void {
  const now = Date.now();

  // Process metrics
  const memory = process.memoryUsage();
  lines.push('# TYPE process_memory_bytes gauge');
  lines.push(`process_memory_heap_total_bytes ${memory.heapTotal} ${now}`);
  lines.push(`process_memory_heap_used_bytes ${memory.heapUsed} ${now}`);
  lines.push(`process_memory_rss_bytes ${memory.rss} ${now}`);
  lines.push(`process_memory_external_bytes ${memory.external} ${now}`);
  lines.push('');

  // CPU metrics
  const cpu = process.cpuUsage();
  lines.push('# TYPE process_cpu_seconds counter');
  lines.push(`process_cpu_user_seconds_total ${cpu.user / 1000000} ${now}`);
  lines.push(`process_cpu_system_seconds_total ${cpu.system / 1000000} ${now}`);
  lines.push('');

  // Uptime metric
  lines.push('# TYPE process_uptime_seconds counter');
  lines.push(`process_uptime_seconds ${process.uptime()} ${now}`);
  lines.push('');

  // Node.js version
  lines.push('# TYPE nodejs_version_info gauge');
  lines.push(`nodejs_version_info{version="${process.version}"} 1 ${now}`);
  lines.push('');

  // Event loop metrics
  if (typeof process.hrtime === 'function') {
    const [seconds, nanoseconds] = process.hrtime();
    lines.push('# TYPE nodejs_eventloop_lag_seconds gauge');
    lines.push(`nodejs_eventloop_lag_seconds ${seconds + nanoseconds / 1e9} ${now}`);
    lines.push('');
  }
} 