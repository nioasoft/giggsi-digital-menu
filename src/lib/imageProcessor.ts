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
  
  // Process original with size limits
  const MAX_ORIGINAL_SIZE = 2000 // Maximum dimension for original
  let originalWidth = img.width
  let originalHeight = img.height
  
  // Scale down if original is too large
  if (originalWidth > MAX_ORIGINAL_SIZE || originalHeight > MAX_ORIGINAL_SIZE) {
    const scale = Math.min(MAX_ORIGINAL_SIZE / originalWidth, MAX_ORIGINAL_SIZE / originalHeight)
    originalWidth = Math.round(originalWidth * scale)
    originalHeight = Math.round(originalHeight * scale)
    console.log(`📐 Scaling original from ${img.width}x${img.height} to ${originalWidth}x${originalHeight}`)
  }
  
  // Process original with adaptive quality
  canvas.width = originalWidth
  canvas.height = originalHeight
  ctx.drawImage(img, 0, 0, originalWidth, originalHeight)
  
  // Convert original with progressive compression
  const original = await compressWithSizeTarget(
    canvas,
    ctx,
    1024 * 1024, // 1MB target for original
    'original',
    file.size
  )
  
  // Process different sizes with specific targets
  const small = await resizeImageWithTarget(img, 400, canvas, ctx, 100 * 1024) // 100KB target
  const medium = await resizeImageWithTarget(img, 800, canvas, ctx, 150 * 1024) // 150KB target
  const large = await resizeImageWithTarget(img, 1200, canvas, ctx, 300 * 1024) // 300KB target

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

// Progressive compression with size target
async function compressWithSizeTarget(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  targetSize: number,
  label: string,
  originalFileSize: number
): Promise<Blob> {
  // Determine initial quality based on original file size
  let quality: number
  const fileSizeMB = originalFileSize / (1024 * 1024)
  
  // Adaptive initial quality based on input size
  if (fileSizeMB > 10) {
    quality = 0.4 // Very large files start with low quality
  } else if (fileSizeMB > 5) {
    quality = 0.5 // Large files
  } else if (fileSizeMB > 2) {
    quality = 0.6 // Medium files
  } else {
    quality = 0.7 // Small files maintain good quality
  }
  
  console.log(`🎯 ${label}: Starting compression (input: ${(originalFileSize/1024/1024).toFixed(1)}MB, initial quality: ${quality})`)
  
  // Try up to 3 attempts with decreasing quality
  for (let attempt = 0; attempt < 3; attempt++) {
    const blob = await createAVIFBlob(canvas, quality)
    
    if (blob) {
      const sizeKB = blob.size / 1024
      const sizeMB = sizeKB / 1024
      
      console.log(`  Attempt ${attempt + 1}: ${sizeKB.toFixed(0)}KB at quality ${quality}`)
      
      // If size is acceptable or we can't compress more, return
      if (blob.size <= targetSize || quality <= 0.3) {
        console.log(`✅ ${label} compressed: ${sizeMB.toFixed(2)}MB (target: ${(targetSize/1024/1024).toFixed(1)}MB)`)
        return blob
      }
      
      // Reduce quality for next attempt
      quality = Math.max(0.3, quality - 0.15)
    } else {
      // Fallback to WebP if AVIF fails
      const webpFallback = await createWebPBlob(canvas, Math.min(0.85, quality + 0.1))
      if (webpFallback) return webpFallback
      throw new Error('Failed to create AVIF or WebP blob')
    }
  }
  
  // Final attempt with minimum quality
  const finalBlob = await createAVIFBlob(canvas, 0.3)
  if (finalBlob) return finalBlob
  
  // Last resort: WebP
  const webpBlob = await createWebPBlob(canvas, 0.7)
  if (webpBlob) return webpBlob
  
  throw new Error('Failed to compress image to target size')
}

// Create AVIF blob with specific quality
function createAVIFBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      'image/avif',
      quality
    )
  })
}

// Create WebP blob with specific quality
function createWebPBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      'image/webp',
      quality
    )
  })
}

// Resize image with size target
async function resizeImageWithTarget(
  img: HTMLImageElement,
  maxWidth: number,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  targetSize: number
): Promise<Blob> {
  // Always resize to exact target size for consistency
  // Images are already square (1:1) from crop editor
  const size = maxWidth
  
  // Set canvas dimensions (square)
  canvas.width = size
  canvas.height = size
  
  // Draw resized image (already square from crop)
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, size, size)
  
  // Get approximate original file size for this resolution
  const pixelCount = img.width * img.height
  const resizedPixelCount = size * size
  const estimatedSize = (pixelCount > 0) ? 
    (resizedPixelCount / pixelCount) * (img.src.length * 0.75) : // Rough estimate
    targetSize * 2
  
  // Compress with size target
  return compressWithSizeTarget(
    canvas,
    ctx,
    targetSize,
    `${size}px`,
    estimatedSize
  )
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
  itemName: string,
  categoryEn?: string,  // Optional English category name
  itemNameEn?: string   // Optional English item name
): Promise<{
  original: string
  small: string
  medium: string
  large: string
}> {
  const processed = await processImage(file)
  const timestamp = Date.now()
  
  // Sanitize path segment - prefer English, fallback to transliteration or timestamp
  const sanitizePathSegment = (enName: string | undefined, heName: string, prefix: string = 'item'): string => {
    // Check if enName actually contains English characters (not Hebrew/Arabic/Cyrillic)
    const hasEnglishChars = (str: string | undefined): boolean => {
      if (!str) return false
      // Check if string contains Latin alphabet characters
      return /[a-zA-Z]/.test(str)
    }
    
    // First try English name if it actually contains English
    if (enName && hasEnglishChars(enName)) {
      const cleaned = enName
        .replace(/[^\w\s-]/g, '')  // Keep only alphanumeric, spaces, dashes
        .replace(/\s+/g, '-')       // Replace spaces with dashes
        .toLowerCase()
        .trim()
      
      if (cleaned && cleaned !== '' && cleaned !== '-') {
        return cleaned
      }
    }
    
    // If enName exists but contains non-English (like Hebrew), try extracting any English from heName
    // Sometimes Hebrew names contain English words mixed in
    const extractEnglish = (str: string): string => {
      // Extract only Latin characters and numbers
      const extracted = str.match(/[a-zA-Z0-9\s-]+/g)
      if (extracted) {
        const joined = extracted.join('-')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .toLowerCase()
          .trim()
        if (joined && joined !== '-') {
          return joined
        }
      }
      return ''
    }
    
    // Try extracting English from Hebrew name
    const extractedEnglish = extractEnglish(heName)
    if (extractedEnglish) {
      return extractedEnglish
    }
    
    // Ultimate fallback: use prefix with unique ID (not just timestamp to avoid duplicates)
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return `${prefix}_${uniqueId}`
  }
  
  // Generate paths using English names when available
  const categoryPath = sanitizePathSegment(categoryEn, category, 'category')
  const itemPath = sanitizePathSegment(itemNameEn, itemName, 'item')
  const basePath = `${categoryPath}/${itemPath}_${timestamp}`
  
  // Get file extension based on blob type - modern formats only
  const getExtension = (blob: Blob | File) => {
    if (blob.type === 'image/avif') return 'avif'
    if (blob.type === 'image/webp') return 'webp'
    // Default to avif extension for modern approach
    return 'avif'
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

export async function deleteOldImages(urls: string[]): Promise<void> {
  if (!urls || urls.length === 0) return
  
  // Extract file paths from URLs
  const paths = urls
    .filter(url => url && url.includes('menu-images'))
    .map(url => {
      // Extract path after 'menu-images/'
      const parts = url.split('/menu-images/')
      return parts[1] || null
    })
    .filter(path => path !== null) as string[]
  
  if (paths.length === 0) return
  
  try {
    const { error } = await supabase.storage
      .from('menu-images')
      .remove(paths)
    
    if (error) {
      console.error('Failed to delete old images:', error)
    } else {
      console.log(`✅ Deleted ${paths.length} old images:`, paths)
    }
  } catch (err) {
    console.error('Error deleting old images:', err)
  }
}