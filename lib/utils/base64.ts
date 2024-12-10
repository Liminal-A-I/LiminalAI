import { logger } from '@/core/services/Logger';

/**
 * Options for base64 conversion
 */
interface Base64Options {
  /** Maximum allowed file size in bytes */
  maxSize?: number;
  /** Allowed MIME types */
  allowedTypes?: string[];
}

/**
 * Default options for base64 conversion
 */
const DEFAULT_OPTIONS: Base64Options = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
};

/**
 * Converts a Blob to a base64 string
 * @param blob - The Blob to convert
 * @param options - Conversion options
 * @returns Promise resolving to the base64 string
 * @throws Error if validation fails or conversion fails
 */
export async function blobToBase64(
  blob: Blob,
  options: Base64Options = {}
): Promise<string> {
  try {
    // Merge options with defaults
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

    // Validate blob
    validateBlob(blob, mergedOptions);

    // Convert blob to base64
    const base64 = await convertBlobToBase64(blob);

    logger.debug('Blob converted to base64 successfully', {
      size: blob.size,
      type: blob.type,
    });

    return base64;
  } catch (error) {
    logger.error('Error converting blob to base64:', error);
    throw error;
  }
}

/**
 * Validates a blob against the provided options
 * @param blob - The blob to validate
 * @param options - The validation options
 * @throws Error if validation fails
 */
function validateBlob(blob: Blob, options: Base64Options): void {
  // Check file size
  if (options.maxSize && blob.size > options.maxSize) {
    throw new Error(
      `File size (${blob.size} bytes) exceeds maximum allowed size (${options.maxSize} bytes)`
    );
  }

  // Check file type
  if (options.allowedTypes && !options.allowedTypes.includes(blob.type)) {
    throw new Error(
      `File type "${blob.type}" is not allowed. Allowed types: ${options.allowedTypes.join(
        ', '
      )}`
    );
  }
}

/**
 * Converts a blob to base64 using FileReader
 * @param blob - The blob to convert
 * @returns Promise resolving to the base64 string
 */
function convertBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader result is not a string'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read blob'));
    };
    
    reader.readAsDataURL(blob);
  });
}

/**
 * Checks if a base64 string is valid
 * @param base64 - The base64 string to validate
 * @returns boolean indicating if the string is valid base64
 */
export function isValidBase64(base64: string): boolean {
  try {
    // Remove data URL prefix if present
    const base64Data = base64.split(',')[1] || base64;
    
    // Check if the string contains only valid base64 characters
    const regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return regex.test(base64Data);
  } catch {
    return false;
  }
}

/**
 * Gets the MIME type from a base64 string
 * @param base64 - The base64 string
 * @returns The MIME type or null if not found
 */
export function getMimeTypeFromBase64(base64: string): string | null {
  try {
    const match = base64.match(/^data:([^;]+);base64,/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
} 