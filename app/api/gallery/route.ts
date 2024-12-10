import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";
import { z } from 'zod';
import { logger } from '@/core/services/Logger';
import { env } from '@/config/config';

// Response types
interface Site {
  siteId: string;
  url: string;
  createdAt: string;
}

interface ListSitesResponse {
  sites: Site[];
  hasMore: boolean;
  nextCursor: string | null;
}

// Constants
const PAGE_SIZE = 10;
const BASE_URL = 'https://LiminalAI.site';

// Initialize S3 client
const s3Client = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY,
  }
});

// Query parameters validation schema
const querySchema = z.object({
  startAfter: z.string().optional(),
});

/**
 * Lists hosted sites with pagination
 * GET /api/gallery
 */
export async function GET(request: Request) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const { startAfter } = querySchema.parse(Object.fromEntries(searchParams));

    logger.info('Listing sites', { startAfter });

    // Fetch sites from S3
    const response = await listCreationsFromS3(startAfter);

    // Process response
    const sites = processCreations(response);
    
    const result: ListSitesResponse = {
      sites,
      hasMore: response.IsTruncated || false,
      nextCursor: response.NextContinuationToken || null,
    };

    logger.info('Sites listed successfully', {
      count: sites.length,
      hasMore: result.hasMore,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Lists sites from S3 bucket
 */
async function listCreationsFromS3(startAfter?: string): Promise<ListObjectsV2CommandOutput> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: env.R2_BUCKET_NAME,
      Delimiter: '/',
      MaxKeys: PAGE_SIZE,
      ...(startAfter && { ContinuationToken: startAfter }),
    });

    const response = await s3Client.send(command);

    logger.debug('S3 response received', {
      prefixCount: response.CommonPrefixes?.length,
      isTruncated: response.IsTruncated,
    });

    return response;
  } catch (error) {
    logger.error('Error fetching from S3:', error);
    throw new Error('Failed to fetch sites from storage');
  }
}

/**
 * Processes S3 response into Site objects
 */
function processCreations(response: ListObjectsV2CommandOutput): Site[] {
  return (response.CommonPrefixes || [])
    .map(prefix => {
      const siteId = prefix.Prefix?.replace('/', '');
      if (!siteId) {
        logger.warn('Invalid prefix found', { prefix: prefix.Prefix });
        return null;
      }
      
      return {
        siteId,
        url: `${BASE_URL}/${siteId}/index.html`,
        createdAt: new Date().toISOString()
      };
    })
    .filter((site): site is Site => site !== null)
    .sort((a, b) => b.siteId.localeCompare(a.siteId));
}

/**
 * Handles API errors and returns appropriate responses
 */
function handleError(error: unknown): NextResponse {
  if (error instanceof z.ZodError) {
    logger.warn('Invalid query parameters', { errors: error.errors });
    return NextResponse.json(
      { error: 'Invalid query parameters', details: error.errors },
      { status: 400 }
    );
  }

  logger.error('Error listing sites:', error);
  return NextResponse.json(
    { error: 'Failed to list sites' },
    { status: 500 }
  );
} 