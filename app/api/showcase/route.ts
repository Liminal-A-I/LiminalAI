import { NextResponse } from 'next/server';
import { ShowcaseService } from '@/services/ShowcaseService';
import { z } from 'zod';
import { logger } from '@/core/services/Logger';

const querySchema = z.object({
  startAfter: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { startAfter } = querySchema.parse(Object.fromEntries(searchParams));

    const showcaseService = new ShowcaseService();
    const response = await showcaseService.listSites(startAfter);

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error listing showcase sites:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to list sites' },
      { status: 500 }
    );
  }
} 