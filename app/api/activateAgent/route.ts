import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import { z } from 'zod';
import { logger } from '@/core/services/Logger';
import { env } from '@/config/config';
import { rateLimit } from '@/lib/rateLimit';
import { validateApiKey } from '@/lib/auth';
import { sanitizeHtml } from '@/lib/security';
import { cacheResponse } from '@/lib/cache';

// Types
interface ImageAnalysis {
  needsImages: boolean;
  imageQuery?: string; 
  imageCount?: number;
}

interface ImageInfo {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  format?: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message?: {
      content: string;
      role?: string;
    };
    index?: number;
    finish_reason?: string;
  }>;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Constants
const MAX_IMAGES = 5;
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000;
const RATE_LIMIT = {
  windowMs: 60000,
  max: 100
};

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const CLAUDE_MODEL = 'anthropic/claude-3.5-sonnet';

// Request validation schema
const requestSchema = z.object({
  image: z.string().url().max(2048),
  options: z.object({
    optimize: z.boolean().optional(),
    format: z.enum(['html', 'jsx']).optional(),
    minify: z.boolean().optional()
  }).optional()
});

// Prompts
const systemPrompt = `You are an expert Tailwind developer tasked with creating pixel-perfect HTML implementations of user wireframes.

CRITICAL RULES:
1. Create an EXACT replica of the wireframe - do not add or remove any elements
2. Match all visual properties precisely:
   - Layout/positioning
   - Sizes and proportions 
   - Colors and styling (EXACTLY as shown - if background is white, use white, not dark!)
   - Text content and formatting
3. Only use images if they are explicitly drawn in the wireframe
4. Preserve all spacing and alignment relationships
5. Use semantic HTML elements appropriately
6. COLORS ARE CRITICAL:
   - If the wireframe shows a white/light background, use white/light background
   - If the wireframe shows a dark background, use dark background
   - Never invert or change the color scheme from what is shown
   - Background colors must match the wireframe exactly

IMPLEMENTATION GUIDELINES:
- Use Tailwind CSS classes exclusively for styling
- Ensure responsive behavior matches the wireframe
- Maintain exact proportions at different screen sizes
- Add hover/focus states only if indicated in the wireframe
- Keep the implementation minimal and avoid unnecessary elements
- For white backgrounds, use bg-white or no background class
- For dark backgrounds, use appropriate dark classes

OUTPUT FORMAT:
Return ONLY the complete HTML file with Tailwind classes, nothing else.
The file must include:
1. DOCTYPE and HTML tags
2. Tailwind CSS CDN link
3. Appropriate meta tags
4. The exact implementation in the body
5. EXACT color matching:
   - If wireframe has white/light background -> use white/light background
   - If wireframe has dark background -> use dark background
   - Never assume or default to dark mode
   - Match colors precisely as shown in wireframe
6. MAKE SURE THAT EVERYTHING IS ALSO POSITIONED CORRECLTY AND DOUBLE AND TRIPLE CHECK! THAT IS CRITIABL THAT EVERYTHING IS IN THE POSTION THAT THEY HAVE DRAWN.
Remember: Your goal is to create a perfect 1:1 match with the wireframe, not to enhance or modify the design. The background color must be EXACTLY as shown in the wireframe - if it's white, keep it white!`;

const imageAnalysisPrompt = `Analyze this webpage design to determine if and what images are needed.

CRITICAL RULES:
1. ONLY identify images that are explicitly drawn/indicated in the wireframe
2. Do NOT suggest images for decorative or enhancement purposes
3. If the wireframe has placeholder boxes or explicit image elements, identify those
4. Count each unique image placement in the design

ANALYSIS REQUIREMENTS:
1. Determine if the design contains any explicit image elements
2. For each image found:
   - Note its context and purpose
   - Create a specific search query that would find an appropriate image
3. Count the total number of unique image placements

OUTPUT FORMAT:
Return ONLY a JSON object with these fields:
{
  "needsImages": boolean (true only if explicit image elements exist),
  "imageQuery": string (specific search query, only if needsImages is true),
  "imageCount": number (count of unique image placements, only if needsImages is true)
}`;

/**
 * Converts wireframe to HTML
 * POST /api/activateAgent
 */
export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Validate API key
    const apiKey = request.headers.get('x-api-key');
    if (!await validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const { image, options = {} } = requestSchema.parse(body);

    logger.info('Processing wireframe to HTML', { image });

    // Check cache first
    const cachedResponse = await cacheResponse(image);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    // Analyze image for required images
    const imageAnalysis = await analyzeImage(image);
    logger.debug('Image analysis complete', imageAnalysis);

    // Fetch and process images if needed
    const imageUrls = imageAnalysis.needsImages
      ? await processImages(imageAnalysis)
      : [];

    // Generate HTML
    const html = await generateHtml(image, imageUrls, options);

    // Cache response
    await cacheResponse(image, html);

    logger.info('HTML generation complete');
    return NextResponse.json(html);

  } catch (error) {
    return handleError(error);
  }
}

/**
 * Analyzes the wireframe image to determine image requirements
 */
async function analyzeImage(image: string): Promise<ImageAnalysis> {
  try {
    const response = await axios.post<OpenRouterResponse>(
      OPENROUTER_API_URL,
      {
        model: CLAUDE_MODEL,
        messages: [
          { role: 'system', content: imageAnalysisPrompt },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: image, detail: 'high' } },
              {
                type: 'text',
                text: 'Analyze this wireframe and determine if it contains any explicit image elements that need to be replaced with real images. Remember: ONLY identify images that are clearly drawn or indicated in the design - do not suggest adding images that aren\'t explicitly shown',
              },
            ],
          },
        ],
        max_tokens: 10000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: TIMEOUT_MS,
      }
    );

    return JSON.parse(response.data.choices[0].message?.content || '{}');
  } catch (error) {
    logger.error('Error analyzing image:', error);
    throw new Error('Failed to analyze wireframe');
  }
}

/**
 * Processes and fetches required images with retries and fallbacks
 */
async function processImages(analysis: ImageAnalysis): Promise<ImageInfo[]> {
  if (!analysis.needsImages || !analysis.imageQuery) {
    return [];
  }

  try {
    const apiKeys = env.PIXABAY_API_KEYS?.split(',') || [];
    if (apiKeys.length === 0) {
      throw new Error('No Pixabay API keys configured');
    }

    const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
    const count = Math.min(analysis.imageCount || 1, MAX_IMAGES);
    const pixabayUrl = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(analysis.imageQuery)}&image_type=vector,illustration&safesearch=true`;

    const pixabayResponse = await axios.get(pixabayUrl, { timeout: TIMEOUT_MS });
    return await uploadImages(pixabayResponse.data.hits.slice(0, count), analysis.imageQuery);
  } catch (error) {
    logger.error('Error processing images:', error);
    throw new Error('Failed to process images');
  }
}

/**
 * Uploads images to Cloudflare with optimization and validation
 */
async function uploadImages(images: any[], defaultAlt: string): Promise<ImageInfo[]> {
  return Promise.all(
    images.map(async (image) => {
      let retries = 0;
      while (retries < MAX_RETRIES) {
        try {
          const imageResponse = await axios.get(image.webformatURL, {
            responseType: 'arraybuffer',
            timeout: TIMEOUT_MS,
          });

          // Validate image data
          if (!imageResponse.data || imageResponse.data.length === 0) {
            throw new Error('Invalid image data received');
          }

          const formData = new FormData();
          formData.append(
            'file',
            new Blob([imageResponse.data], { type: 'image/png' }),
            'image.png'
          );

          const uploadResponse = await axios.post(
            `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
            formData,
            {
              headers: {
                'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'multipart/form-data',
              },
              timeout: TIMEOUT_MS,
            }
          );

          return {
            url: uploadResponse.data.result.variants[0],
            alt: sanitizeHtml(image.tags || defaultAlt),
            width: image.imageWidth,
            height: image.imageHeight,
            format: image.type,
          };
        } catch (error) {
          retries++;
          if (retries === MAX_RETRIES) {
            logger.warn('Failed to upload image, using original URL:', error);
            return {
              url: image.webformatURL,
              alt: sanitizeHtml(image.tags || defaultAlt),
              width: image.imageWidth,
              height: image.imageHeight,
              format: image.type,
            };
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
      throw new Error('Failed to upload image after retries');
    })
  );
}

/**
 * Generates HTML from the wireframe with optimization options
 */
async function generateHtml(image: string, imageUrls: ImageInfo[], options: any): Promise<any> {
  try {
    const response = await axios.post<OpenRouterResponse>(
      OPENROUTER_API_URL,
      {
        model: CLAUDE_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: image, detail: 'high' } },
              {
                type: 'text',
                text: `Turn this into a single html file using tailwind that looks exactly like the image. If you need to use an image choose from these below MAKE SURE TO ONLY USE IMAGES IF THE DRAWN CALLS FOR IT. IF THE PERSON WEBSITE DOES NOT HAVE IMAGES THAT HE HAS DRAWN NEVER ADD THEM.. USE THESE ONLY IF NEEDED\n\n${imageUrls
                  .map((image) => `<img src="${image.url}" alt="${image.alt}" width="${image.width}" height="${image.height}" loading="lazy" />`)
                  .join('\n')}\n\n`,
              },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://github.com/CursorAI',
          'X-Title': 'LiminalAI',
          'Content-Type': 'application/json',
        },
        timeout: TIMEOUT_MS,
      }
    );

    let html = response.data;
    return html;
  } catch (error) {
    logger.error('Error generating HTML:', error);
    throw new Error('Failed to generate HTML');
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

  if (error instanceof AxiosError) {
    const status = error.response?.status || 500;
    logger.error('External service error:', error);
    return NextResponse.json(
      { error: 'External service error', details: error.message },
      { status }
    );
  }

  logger.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
