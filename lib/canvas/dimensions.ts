import canvasSize from 'canvas-size';
import { logger } from '@/core/services/Logger';

/**
 * Interface for canvas dimensions
 */
export interface CanvasDimensions {
  width: number;
  height: number;
}

/**
 * Interface for canvas size limits
 */
export interface CanvasMaxSize {
  maxWidth: number;
  maxHeight: number;
  maxArea: number;
}

/**
 * Interface for canvas size options
 */
interface CanvasSizeOptions {
  /** Maximum time to wait for size detection in milliseconds */
  timeout?: number;
  /** Whether to use WebGL for size detection */
  useWebGL?: boolean;
  /** Fallback dimensions if detection fails */
  fallback?: CanvasMaxSize;
}

/**
 * Default options for canvas size detection
 */
const DEFAULT_OPTIONS: Required<CanvasSizeOptions> = {
  timeout: 5000,
  useWebGL: true,
  fallback: {
    maxWidth: 16384,
    maxHeight: 16384,
    maxArea: 16384 * 16384,
  },
};

// Cache for browser canvas size to avoid repeated detection
let maxSizePromise: Promise<CanvasMaxSize> | null = null;

/**
 * Gets the maximum canvas size supported by the browser
 * @param options - Options for size detection
 * @returns Promise resolving to the maximum canvas dimensions
 */
export async function getBrowserCanvasMaxSize(
  options: CanvasSizeOptions = {}
): Promise<CanvasMaxSize> {
  try {
    // Return cached size if available
    if (maxSizePromise) {
      return maxSizePromise;
    }

    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    maxSizePromise = detectCanvasSize(mergedOptions);
    const result = await maxSizePromise;

    logger.debug('Detected browser canvas max size:', result);
    return result;
  } catch (error) {
    logger.error('Error detecting canvas size:', error);
    return DEFAULT_OPTIONS.fallback;
  }
}

/**
 * Detects the maximum canvas size using the canvas-size library
 * @param options - Detection options
 * @returns Promise resolving to the maximum canvas dimensions
 */
async function detectCanvasSize(
  options: Required<CanvasSizeOptions>
): Promise<CanvasMaxSize> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Canvas size detection timed out after ${options.timeout}ms`));
    }, options.timeout);

    Promise.all([
      detectMaxWidth(options.useWebGL),
      detectMaxHeight(options.useWebGL),
      detectMaxArea(options.useWebGL),
    ])
      .then(([maxWidth, maxHeight, maxArea]) => {
        clearTimeout(timeoutId);
        resolve({ maxWidth, maxHeight, maxArea });
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Detects the maximum canvas width
 * @param useWebGL - Whether to use WebGL for detection
 * @returns Promise resolving to the maximum width
 */
async function detectMaxWidth(useWebGL: boolean): Promise<number> {
  try {
    const result = await canvasSize.maxWidth({
      useWebGL,
      useWorker: false,
      usePromise: true,
    });
    return result.width;
  } catch (error) {
    logger.error('Error detecting max width:', error);
    return DEFAULT_OPTIONS.fallback.maxWidth;
  }
}

/**
 * Detects the maximum canvas height
 * @param useWebGL - Whether to use WebGL for detection
 * @returns Promise resolving to the maximum height
 */
async function detectMaxHeight(useWebGL: boolean): Promise<number> {
  try {
    const result = await canvasSize.maxHeight({
      useWebGL,
      useWorker: false,
      usePromise: true,
    });
    return result.height;
  } catch (error) {
    logger.error('Error detecting max height:', error);
    return DEFAULT_OPTIONS.fallback.maxHeight;
  }
}

/**
 * Detects the maximum canvas area
 * @param useWebGL - Whether to use WebGL for detection
 * @returns Promise resolving to the maximum area
 */
async function detectMaxArea(useWebGL: boolean): Promise<number> {
  try {
    const result = await canvasSize.maxArea({
      useWebGL,
      useWorker: false,
      usePromise: true,
    });
    return result.width * result.height;
  } catch (error) {
    logger.error('Error detecting max area:', error);
    return DEFAULT_OPTIONS.fallback.maxArea;
  }
}

/**
 * Checks if the browser supports large canvas sizes
 * @param minWidth - Minimum required width
 * @param minHeight - Minimum required height
 * @returns Promise resolving to boolean indicating support
 */
export async function supportsLargeCanvas(
  minWidth: number,
  minHeight: number
): Promise<boolean> {
  try {
    const maxSize = await getBrowserCanvasMaxSize();
    return maxSize.maxWidth >= minWidth && maxSize.maxHeight >= minHeight;
  } catch {
    return false;
  }
}

/**
 * Gets the optimal dimensions for a canvas based on content size and browser limits
 * @param contentWidth - Desired content width
 * @param contentHeight - Desired content height
 * @returns Promise resolving to the optimal dimensions
 */
export async function getOptimalCanvasSize(
  contentWidth: number,
  contentHeight: number
): Promise<CanvasDimensions> {
  const maxSize = await getBrowserCanvasMaxSize();
  
  // Calculate scale to fit within browser limits
  const scaleX = maxSize.maxWidth / contentWidth;
  const scaleY = maxSize.maxHeight / contentHeight;
  const scale = Math.min(1, scaleX, scaleY);
  
  return {
    width: Math.floor(contentWidth * scale),
    height: Math.floor(contentHeight * scale),
  };
} 