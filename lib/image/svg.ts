import { getBrowserCanvasMaxSize } from '../canvas/dimensions';
import { PngHelpers } from './png';
import { logger } from '@/core/services/Logger';

/**
 * Supported image types for copying
 */
export type CopyImageType = 'jpeg' | 'json' | 'png' | 'svg';

/**
 * Supported image types for exporting
 */
export type ExportImageType = CopyImageType | 'webp';

/**
 * Options for SVG conversion
 */
interface SvgConversionOptions {
  /** Output image type */
  type: CopyImageType | ExportImageType;
  /** Image quality (0-1) */
  quality: number;
  /** Scale factor */
  scale: number;
  /** Background color */
  backgroundColor?: string;
}

/**
 * Converts an SVG element to an image
 * @param svg - The SVG element to convert
 * @param options - Conversion options
 * @returns Promise resolving to a Blob or null if conversion fails
 */
export async function getSvgAsImage(
  svg: SVGElement,
  options: SvgConversionOptions
): Promise<Blob | null> {
  try {
    const { type, quality, scale, backgroundColor } = options;

    // Get original dimensions
    const width = +svg.getAttribute('width')!;
    const height = +svg.getAttribute('height')!;
    
    // Calculate scaled dimensions
    const { scaledWidth, scaledHeight, effectiveScale } = await calculateDimensions(
      width,
      height,
      scale
    );

    logger.debug('Converting SVG to image', {
      originalSize: { width, height },
      scaledSize: { width: scaledWidth, height: scaledHeight },
      scale: effectiveScale,
    });

    // Convert SVG to data URL
    const dataUrl = await getSvgAsDataUrl(svg);

    // Create canvas and draw image
    const canvas = await createCanvas(
      dataUrl,
      scaledWidth,
      scaledHeight,
      backgroundColor
    );

    if (!canvas) {
      logger.error('Failed to create canvas');
      return null;
    }

    // Convert canvas to blob
    const blob = await canvasToBlob(canvas, type, quality);
    if (!blob) {
      logger.error('Failed to convert canvas to blob');
      return null;
    }

    // Add physical size information
    const view = new DataView(await blob.arrayBuffer());
    return PngHelpers.setPhysChunk(view, effectiveScale, {
      type: `image/${type}`,
    });
  } catch (error) {
    logger.error('Error converting SVG to image:', error);
    return null;
  }
}

/**
 * Calculates scaled dimensions based on browser limits
 */
async function calculateDimensions(
  width: number,
  height: number,
  scale: number
) {
  const canvasSizes = await getBrowserCanvasMaxSize();
  let scaledWidth = width * scale;
  let scaledHeight = height * scale;

  // Adjust for maximum width
  if (width > canvasSizes.maxWidth) {
    scaledWidth = canvasSizes.maxWidth;
    scaledHeight = (scaledWidth / width) * height;
  }

  // Adjust for maximum height
  if (height > canvasSizes.maxHeight) {
    scaledHeight = canvasSizes.maxHeight;
    scaledWidth = (scaledHeight / height) * width;
  }

  // Adjust for maximum area
  if (scaledWidth * scaledHeight > canvasSizes.maxArea) {
    const ratio = Math.sqrt(canvasSizes.maxArea / (scaledWidth * scaledHeight));
    scaledWidth *= ratio;
    scaledHeight *= ratio;
  }

  return {
    scaledWidth: Math.floor(scaledWidth),
    scaledHeight: Math.floor(scaledHeight),
    effectiveScale: scaledWidth / width,
  };
}

/**
 * Creates a canvas with the SVG image
 */
async function createCanvas(
  dataUrl: string,
  width: number,
  height: number,
  backgroundColor?: string
): Promise<HTMLCanvasElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = async () => {
      // Wait for fonts to load (Safari fix)
      await new Promise((resolve) => setTimeout(resolve, 250));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      canvas.width = width;
      canvas.height = height;

      // Apply background if specified
      if (backgroundColor) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, 0, 0, width, height);

      URL.revokeObjectURL(dataUrl);
      resolve(canvas);
    };

    image.onerror = () => {
      logger.error('Failed to load image');
      resolve(null);
    };

    image.src = dataUrl;
  });
}

/**
 * Converts a canvas to a blob
 */
async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      `image/${type}`,
      quality
    );
  });
}

/**
 * Converts an SVG element to a data URL
 */
export async function getSvgAsDataUrl(svg: SVGElement): Promise<string> {
  try {
    const clone = svg.cloneNode(true) as SVGGraphicsElement;
    clone.setAttribute('encoding', 'UTF-8');

    const fileReader = new FileReader();
    const imgs = Array.from(clone.querySelectorAll('image')) as SVGImageElement[];

    // Process embedded images
    for (const img of imgs) {
      const src = img.getAttribute('xlink:href');
      if (src && !src.startsWith('data:')) {
        try {
          const blob = await (await fetch(src)).blob();
          const base64 = await blobToBase64(blob, fileReader);
          img.setAttribute('xlink:href', base64);
        } catch (error) {
          logger.error('Failed to process embedded image:', error);
        }
      }
    }

    return getSvgAsDataUrlSync(clone);
  } catch (error) {
    logger.error('Error converting SVG to data URL:', error);
    throw error;
  }
}

/**
 * Converts a blob to base64 using FileReader
 */
function blobToBase64(blob: Blob, fileReader: FileReader): Promise<string> {
  return new Promise((resolve, reject) => {
    fileReader.onload = () => resolve(fileReader.result as string);
    fileReader.onerror = () => reject(fileReader.error);
    fileReader.readAsDataURL(blob);
  });
}

/**
 * Converts an SVG element to a data URL synchronously
 */
export function getSvgAsDataUrlSync(node: SVGElement): string {
  try {
    const svgStr = new XMLSerializer().serializeToString(node);
    const base64SVG = window.btoa(unescape(encodeURIComponent(svgStr)));
    return `data:image/svg+xml;base64,${base64SVG}`;
  } catch (error) {
    logger.error('Error converting SVG to data URL synchronously:', error);
    throw error;
  }
} 