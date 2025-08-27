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
  
  // Process different sizes with adaptive targets based on input efficiency
  const originalBytesPerPixel = calculateBytesPerPixel(file.size, img.width, img.height)
  
  // Calculate adaptive targets for each size
  const smallAdaptive = getAdaptiveTarget(400, originalBytesPerPixel)
  const mediumAdaptive = getAdaptiveTarget(800, originalBytesPerPixel)
  const largeAdaptive = getAdaptiveTarget(1200, originalBytesPerPixel)
  
  // Use the smaller of fixed limit or adaptive target
  const small = await resizeImageWithTarget(img, 400, canvas, ctx, Math.min(100 * 1024, smallAdaptive.targetSize))
  const medium = await resizeImageWithTarget(img, 800, canvas, ctx, Math.min(200 * 1024, mediumAdaptive.targetSize))
  const large = await resizeImageWithTarget(img, 1200, canvas, ctx, Math.min(400 * 1024, largeAdaptive.targetSize))

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

// Calculate bytes per pixel to understand compression efficiency
function calculateBytesPerPixel(fileSize: number, width: number, height: number): number {
  const totalPixels = width * height
  return fileSize / totalPixels
}

// Get minimum quality threshold based on input size
function getMinimumQuality(fileSizeKB: number): number {
  if (fileSizeKB < 50) {
    return 0.7  // Small files: preserve quality
  } else if (fileSizeKB < 200) {
    return 0.5  // Medium files: balanced
  } else if (fileSizeKB < 1000) {
    return 0.4  // Large files: moderate compression
  } else {
    return 0.3  // Very large: aggressive compression
  }
}

// Get adaptive target based on resolution and efficiency
function getAdaptiveTarget(width: number, originalBytesPerPixel: number): { targetSize: number, targetBytesPerPixel: number } {
  let targetBytesPerPixel: number
  let maxSize: number
  
  if (width <= 400) {
    targetBytesPerPixel = 0.5  // Small images can have higher bytes/pixel
    maxSize = 100 * 1024       // 100KB max
  } else if (width <= 800) {
    targetBytesPerPixel = 0.4  // Medium images
    maxSize = 200 * 1024       // 200KB max
  } else if (width <= 1200) {
    targetBytesPerPixel = 0.35 // Large images
    maxSize = 400 * 1024       // 400KB max
  } else {
    targetBytesPerPixel = 0.3  // Original/XL images
    maxSize = 1024 * 1024      // 1MB max
  }
  
  // If original is already efficient, don't force compression
  if (originalBytesPerPixel <= targetBytesPerPixel) {
    targetBytesPerPixel = originalBytesPerPixel * 1.1 // Allow 10% increase
  }
  
  const targetSize = Math.min(width * width * targetBytesPerPixel, maxSize)
  return { targetSize, targetBytesPerPixel }
}

// Smart compression with adaptive targets and quality preservation
async function compressWithSizeTarget(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  targetSize: number,
  label: string,
  originalFileSize: number
): Promise<Blob> {
  const sizeKB = originalFileSize / 1024
  const bytesPerPixel = calculateBytesPerPixel(originalFileSize, canvas.width, canvas.height)
  const minQuality = getMinimumQuality(sizeKB)
  
  // Get adaptive target
  const adaptive = getAdaptiveTarget(canvas.width, bytesPerPixel)
  const smartTarget = Math.min(targetSize, adaptive.targetSize)
  
  console.log(`🎯 ${label}: ${canvas.width}x${canvas.height}, input: ${sizeKB.toFixed(0)}KB (${bytesPerPixel.toFixed(2)} bytes/pixel)`)
  console.log(`  Target: ${(smartTarget/1024).toFixed(0)}KB (${adaptive.targetBytesPerPixel.toFixed(2)} bytes/pixel), min quality: ${minQuality}`)
  
  // If already efficient and under target, use high quality
  if (originalFileSize <= smartTarget && bytesPerPixel <= adaptive.targetBytesPerPixel) {
    console.log(`  ✨ Already optimized! Using high quality (0.85)`)
    const blob = await createAVIFBlob(canvas, 0.85) || await createWebPBlob(canvas, 0.85)
    if (blob && blob.size <= originalFileSize * 1.2) {
      console.log(`  ✅ Preserved quality: ${(blob.size/1024).toFixed(0)}KB`)
      return blob
    }
  }
  
  // Determine starting quality based on efficiency
  let quality: number
  if (bytesPerPixel < 0.3) {
    quality = 0.8  // Already well-compressed
  } else if (bytesPerPixel < 0.5) {
    quality = 0.7  // Moderately compressed
  } else if (bytesPerPixel < 1.0) {
    quality = 0.6  // Lightly compressed
  } else {
    quality = 0.5  // Uncompressed or inefficient
  }
  
  // Never go below minimum quality
  quality = Math.max(quality, minQuality)
  
  let bestBlob: Blob | null = null
  let bestSize = Infinity
  const maxAttempts = 5
  
  // Try compression with gradually decreasing quality
  for (let attempt = 0; attempt < maxAttempts && quality >= minQuality; attempt++) {
    // Try AVIF first
    const avifBlob = await createAVIFBlob(canvas, quality)
    
    if (avifBlob) {
      const avifSizeKB = avifBlob.size / 1024
      console.log(`  AVIF attempt ${attempt + 1}: ${avifSizeKB.toFixed(0)}KB at quality ${quality.toFixed(2)}`)
      
      // Check if this is better than what we have
      if (avifBlob.size < bestSize) {
        bestBlob = avifBlob
        bestSize = avifBlob.size
      }
      
      // Accept if: under target AND not significantly larger than original
      if (avifBlob.size <= smartTarget && avifBlob.size <= originalFileSize * 1.2) {
        console.log(`  ✅ ${label} AVIF: ${avifSizeKB.toFixed(0)}KB (target: ${(smartTarget/1024).toFixed(0)}KB)`)
        return avifBlob
      }
    }
    
    // Try WebP at same quality
    const webpBlob = await createWebPBlob(canvas, quality)
    if (webpBlob) {
      const webpSizeKB = webpBlob.size / 1024
      console.log(`  WebP attempt ${attempt + 1}: ${webpSizeKB.toFixed(0)}KB at quality ${quality.toFixed(2)}`)
      
      // Check if WebP is better
      if (webpBlob.size < bestSize) {
        bestBlob = webpBlob
        bestSize = webpBlob.size
      }
      
      // Accept if: under target AND not significantly larger than original
      if (webpBlob.size <= smartTarget && webpBlob.size <= originalFileSize * 1.2) {
        console.log(`  ✅ ${label} WebP: ${webpSizeKB.toFixed(0)}KB (target: ${(smartTarget/1024).toFixed(0)}KB)`)
        return webpBlob
      }
    }
    
    // Reduce quality gradually, but respect minimum
    quality = Math.max(minQuality, quality - 0.1)
  }
  
  // Use the best result we found
  if (bestBlob) {
    const finalSizeKB = bestBlob.size / 1024
    const finalBytesPerPixel = calculateBytesPerPixel(bestBlob.size, canvas.width, canvas.height)
    
    if (bestBlob.size > originalFileSize * 1.2) {
      console.warn(`  ⚠️ ${label}: Output (${finalSizeKB.toFixed(0)}KB) larger than input (${sizeKB.toFixed(0)}KB)`)
      // Try to return original if possible
      console.log(`  Attempting to preserve original...`)
    } else {
      console.log(`  ✅ ${label} final: ${finalSizeKB.toFixed(0)}KB (${finalBytesPerPixel.toFixed(2)} bytes/pixel)`)
    }
    return bestBlob
  }
  
  throw new Error('Failed to compress image')
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

// Smart resize with adaptive compression
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
  
  // Calculate pixels for this size
  const totalPixels = size * size
  const targetBytesPerPixel = targetSize / totalPixels
  
  // Estimate original efficiency (approximate from source image)
  const sourcePixels = img.width * img.height
  const estimatedSourceSize = sourcePixels * 0.3 // Assume moderate compression
  const estimatedSourceKB = estimatedSourceSize / 1024
  
  // Get minimum quality based on estimated size
  const minQuality = getMinimumQuality(estimatedSourceKB)
  
  // Start with reasonable quality based on target efficiency
  let quality: number
  if (targetBytesPerPixel > 0.5) {
    quality = 0.8  // Can use high quality
  } else if (targetBytesPerPixel > 0.3) {
    quality = 0.7  // Good quality
  } else if (targetBytesPerPixel > 0.2) {
    quality = 0.6  // Moderate quality
  } else {
    quality = 0.5  // Need compression
  }
  
  // Respect minimum quality
  quality = Math.max(quality, minQuality)
  
  console.log(`🖼️ Resizing to ${size}px, target: ${(targetSize/1024).toFixed(0)}KB (${targetBytesPerPixel.toFixed(2)} bytes/pixel)`)
  console.log(`  Starting quality: ${quality.toFixed(2)}, minimum: ${minQuality.toFixed(2)}`)
  
  let bestBlob: Blob | null = null
  let bestSize = Infinity
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts && quality >= minQuality) {
    // Try AVIF
    const avifBlob = await createAVIFBlob(canvas, quality)
    if (avifBlob) {
      const avifSizeKB = avifBlob.size / 1024
      const avifBytesPerPixel = avifBlob.size / totalPixels
      
      if (avifBlob.size < bestSize) {
        bestBlob = avifBlob
        bestSize = avifBlob.size
      }
      
      if (avifBlob.size <= targetSize) {
        console.log(`  ✅ AVIF at ${quality.toFixed(2)}: ${avifSizeKB.toFixed(0)}KB (${avifBytesPerPixel.toFixed(2)} bytes/pixel)`)
        return avifBlob
      }
    }
    
    // Try WebP
    const webpBlob = await createWebPBlob(canvas, quality)
    if (webpBlob) {
      const webpSizeKB = webpBlob.size / 1024
      const webpBytesPerPixel = webpBlob.size / totalPixels
      
      if (webpBlob.size < bestSize) {
        bestBlob = webpBlob
        bestSize = webpBlob.size
      }
      
      if (webpBlob.size <= targetSize) {
        console.log(`  ✅ WebP at ${quality.toFixed(2)}: ${webpSizeKB.toFixed(0)}KB (${webpBytesPerPixel.toFixed(2)} bytes/pixel)`)
        return webpBlob
      }
    }
    
    // Log attempt
    if ((avifBlob || webpBlob) && attempts < 3) {  // Only log first few attempts
      const blob = avifBlob && avifBlob.size < (webpBlob?.size || Infinity) ? avifBlob : webpBlob
      if (blob) {
        console.log(`  Attempt ${attempts + 1}: ${(blob.size/1024).toFixed(0)}KB at quality ${quality.toFixed(2)}`)
      }
    }
    
    // Reduce quality gradually, respecting minimum
    quality = Math.max(minQuality, quality - 0.05)
    attempts++
  }
  
  // Use the best result we found
  if (bestBlob) {
    const finalBytesPerPixel = bestBlob.size / totalPixels
    if (bestBlob.size > targetSize) {
      console.warn(`  ⚠️ Could not meet target ${(targetSize/1024).toFixed(0)}KB, using ${(bestBlob.size/1024).toFixed(0)}KB (${finalBytesPerPixel.toFixed(2)} bytes/pixel)`)
    }
    return bestBlob
  }
  
  throw new Error(`Failed to create image within size limit ${(targetSize/1024).toFixed(0)}KB`)
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