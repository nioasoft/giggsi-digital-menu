import { supabase } from './supabase'

interface ProcessedImage {
  original: File
  small: Blob  // 400px width
  medium: Blob // 800px width
  large: Blob  // 1200px width
}

export async function processImage(file: File): Promise<ProcessedImage> {
  // Create canvas for image processing
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available')

  // Load image
  const img = await loadImage(file)
  
  // Process different sizes
  const small = await resizeImage(img, 400, canvas, ctx)
  const medium = await resizeImage(img, 800, canvas, ctx)
  const large = await resizeImage(img, 1200, canvas, ctx)

  return {
    original: file,
    small,
    medium,
    large
  }
}

export async function processImageFromBlob(blob: Blob): Promise<ProcessedImage> {
  // Convert blob to File
  const file = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' })
  
  // Use existing processImage function
  return processImage(file)
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

async function resizeImage(
  img: HTMLImageElement,
  maxWidth: number,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): Promise<Blob> {
  // For cropped images, they're already square (1:1)
  // Just resize maintaining the square aspect ratio
  let size = Math.min(img.width, maxWidth)
  
  // Set canvas dimensions (square)
  canvas.width = size
  canvas.height = size
  
  // Draw resized image (already square from crop)
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, size, size)
  
  // Convert to blob with quality optimization
  // Try AVIF first, fall back to WebP, then JPEG
  return new Promise((resolve, reject) => {
    // Try AVIF format first (best compression)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          // Fallback to WebP
          canvas.toBlob(
            (webpBlob) => {
              if (webpBlob) {
                resolve(webpBlob)
              } else {
                // Final fallback to JPEG
                canvas.toBlob(
                  (jpegBlob) => {
                    if (jpegBlob) resolve(jpegBlob)
                    else reject(new Error('Failed to create blob'))
                  },
                  'image/jpeg',
                  0.85
                )
              }
            },
            'image/webp',
            0.85
          )
        }
      },
      'image/avif',
      0.85
    )
  })
}

export async function uploadToSupabase(
  path: string,
  blob: Blob,
  bucket: string = 'menu-images'
): Promise<string> {
  // Detect content type from blob
  let contentType = blob.type || 'image/jpeg'
  if (contentType === 'image/avif') {
    contentType = 'image/avif'
  } else if (contentType === 'image/webp') {
    contentType = 'image/webp'
  }
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      contentType,
      upsert: true
    })

  if (error) throw error
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return publicUrl
}

export async function uploadProcessedImages(
  file: File,
  category: string,
  itemName: string
): Promise<{
  original: string
  small: string
  medium: string
  large: string
}> {
  const processed = await processImage(file)
  const timestamp = Date.now()
  
  // Sanitize path segments to remove Hebrew, Arabic and special characters
  const sanitizePathSegment = (str: string): string => {
    return str
      .replace(/[\u0590-\u05FF]/g, '') // Remove Hebrew characters
      .replace(/[\u0600-\u06FF]/g, '') // Remove Arabic characters
      .replace(/[\u0400-\u04FF]/g, '') // Remove Cyrillic characters
      .replace(/[^\w\s-]/g, '')        // Remove special characters
      .replace(/\s+/g, '-')             // Replace spaces with dashes
      .toLowerCase()
      .trim() || `item_${Date.now()}`  // Fallback if empty
  }
  
  const basePath = `${sanitizePathSegment(category)}/${sanitizePathSegment(itemName)}_${timestamp}`
  
  // Get file extension based on blob type
  const getExtension = (blob: Blob | File) => {
    if (blob.type === 'image/avif') return 'avif'
    if (blob.type === 'image/webp') return 'webp'
    return 'jpg'
  }
  
  // Upload all sizes
  const [original, small, medium, large] = await Promise.all([
    uploadToSupabase(`${basePath}_original.${getExtension(processed.original)}`, processed.original),
    uploadToSupabase(`${basePath}_small.${getExtension(processed.small)}`, processed.small),
    uploadToSupabase(`${basePath}_medium.${getExtension(processed.medium)}`, processed.medium),
    uploadToSupabase(`${basePath}_large.${getExtension(processed.large)}`, processed.large)
  ])
  
  return { original, small, medium, large }
}

export function getOptimizedImageUrl(
  urls: { small?: string; medium?: string; large?: string; original: string },
  screenWidth: number
): string {
  if (screenWidth <= 400 && urls.small) return urls.small
  if (screenWidth <= 800 && urls.medium) return urls.medium
  if (screenWidth <= 1200 && urls.large) return urls.large
  return urls.original
}