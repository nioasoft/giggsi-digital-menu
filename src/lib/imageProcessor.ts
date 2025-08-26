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
  
  // Convert original to WebP if it's not already AVIF/WebP
  let original: File | Blob = file
  if (file.type !== 'image/avif' && file.type !== 'image/webp') {
    // Convert original to WebP for consistency
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    
    original = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log(`📁 Original converted to WebP: ${(blob.size / 1024).toFixed(1)}KB (was ${(file.size / 1024).toFixed(1)}KB)`)
            resolve(blob)
          } else {
            resolve(file) // Keep original if conversion fails
          }
        },
        'image/webp',
        0.8 // Higher quality for original
      )
    })
  }
  
  // Process different sizes
  const small = await resizeImage(img, 400, canvas, ctx)
  const medium = await resizeImage(img, 800, canvas, ctx)
  const large = await resizeImage(img, 1200, canvas, ctx)

  return {
    original: original as File,
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
  // Always resize to exact target size for consistency
  // Images are already square (1:1) from crop editor
  const size = maxWidth
  
  // Set canvas dimensions (square)
  canvas.width = size
  canvas.height = size
  
  // Draw resized image (already square from crop)
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, size, size)
  
  // Convert to blob with aggressive quality optimization for fast loading
  // Only use modern formats (AVIF or WebP) - no JPEG fallback
  return new Promise((resolve, reject) => {
    // Try AVIF format first (best compression - 50-70% smaller than JPEG)
    canvas.toBlob(
      (avifBlob) => {
        if (avifBlob) {
          console.log(`✅ AVIF created: ${maxWidth}px - Size: ${(avifBlob.size / 1024).toFixed(1)}KB`)
          resolve(avifBlob)
        } else {
          // Fallback to WebP only (still 25-35% smaller than JPEG)
          canvas.toBlob(
            (webpBlob) => {
              if (webpBlob) {
                console.log(`✅ WebP created: ${maxWidth}px - Size: ${(webpBlob.size / 1024).toFixed(1)}KB`)
                resolve(webpBlob)
              } else {
                // No JPEG fallback - WebP is universally supported
                reject(new Error('Failed to create image - browser does not support modern formats'))
              }
            },
            'image/webp',
            0.65 // Lower quality for better compression
          )
        }
      },
      'image/avif',
      0.6 // Aggressive compression for AVIF - still looks great
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
  
  // Get file extension based on blob type - only modern formats
  const getExtension = (blob: Blob | File) => {
    if (blob.type === 'image/avif') return 'avif'
    // Default to webp extension since it's universally supported
    return 'webp'
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