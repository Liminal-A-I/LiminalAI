import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CloudflareR2Service } from '@/services/CloudflareR2Service';
import { logger } from '@/core/services/Logger';

// Request validation schema
const requestSchema = z.object({
  pages: z.array(z.object({
    path: z.string(),
    content: z.string(),
  })),
  siteId: z.string().uuid(),
  metadata: z.object({
    userId: z.string().optional(),
    siteName: z.string().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  }).optional(),
});

// Response type
interface HostSiteResponse {
  success: boolean;
  url: string;
  siteId: string;
}

/**
 * Handles site hosting requests
 * POST /api/host
 */
export async function POST(request: Request) {
  try {
    // Parse and validate request
    const body = await request.json();
    const { pages, siteId, metadata } = requestSchema.parse(body);

    logger.info('Hosting site', { siteId });

    // Initialize R2 service and host site
    const r2Service = new CloudflareR2Service();
    const result = await r2Service.hostSite(pages, siteId, metadata);

    logger.info('Site hosted successfully', { siteId, url: result.url });

    const response: HostSiteResponse = {
      success: true,
      url: result.url,
      siteId: result.siteId,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Handles API errors and returns appropriate responses
 */
function handleError(error: unknown): NextResponse {
  if (error instanceof z.ZodError) {
    logger.warn('Invalid request data', { errors: error.errors });
    return NextResponse.json(
      { error: 'Invalid request data', details: error.errors },
      { status: 400 }
    );
  }

  logger.error('Error hosting site:', error);
  return NextResponse.json(
    { error: 'Failed to host site' },
    { status: 500 }
  );
}

     