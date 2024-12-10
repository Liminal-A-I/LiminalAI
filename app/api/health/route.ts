import { NextResponse } from 'next/server';
import { monitoring, HealthStatus } from '@/src/core/utils/monitoring';
import { ErrorHandler } from '@/src/core/utils/error';
import { env } from '@/src/config/config';

/**
 * Health check endpoint
 * GET /api/health
 */
export async function GET() {
  try {
    // Get current health status
    const health = monitoring.getHealth();

    // Get basic system metrics
    const metrics = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
    };

    // Check external services
    await checkExternalServices();

    // Return health status and metrics
    return NextResponse.json({
      status: health.status,
      version: process.env.npm_package_version || '1.0.0',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      checks: health.checks,
      metrics,
    }, {
      status: health.status === HealthStatus.HEALTHY ? 200 : 
             health.status === HealthStatus.DEGRADED ? 200 : 503,
    });
  } catch (error) {
    const { status, body } = ErrorHandler.toResponse(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * Check external service health
 */
async function checkExternalServices() {
  // Check OpenAI API
  await checkOpenAI();
  
  // Check Cloudflare R2
  await checkCloudflareR2();

  // Check Database (if applicable)
  // await checkDatabase();

  // Check Redis (if applicable)
  // await checkRedis();
}

/**
 * Check OpenAI API health
 */
async function checkOpenAI() {
  const startTime = performance.now();
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      },
    });

    const latency = performance.now() - startTime;
    
    if (response.ok) {
      monitoring.updateHealth('openai', HealthStatus.HEALTHY, {
        latency,
        message: 'OpenAI API is responding normally',
      });
    } else {
      monitoring.updateHealth('openai', HealthStatus.DEGRADED, {
        latency,
        message: `OpenAI API returned status ${response.status}`,
      });
    }
  } catch (error) {
    monitoring.updateHealth('openai', HealthStatus.UNHEALTHY, {
      latency: performance.now() - startTime,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Check Cloudflare R2 health
 */
async function checkCloudflareR2() {
  const startTime = performance.now();
  try {
    // TODO: Implement actual R2 health check
    // For now, just check if credentials are configured
    if (env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_ACCESS_KEY && env.CLOUDFLARE_SECRET_KEY) {
      monitoring.updateHealth('cloudflare-r2', HealthStatus.HEALTHY, {
        latency: 0,
        message: 'Cloudflare R2 credentials are configured',
      });
    } else {
      monitoring.updateHealth('cloudflare-r2', HealthStatus.DEGRADED, {
        latency: 0,
        message: 'Cloudflare R2 credentials are missing',
      });
    }
  } catch (error) {
    monitoring.updateHealth('cloudflare-r2', HealthStatus.UNHEALTHY, {
      latency: performance.now() - startTime,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 