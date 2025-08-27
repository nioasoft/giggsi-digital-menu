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
  // Special handling for already small files
  const sizeKB = originalFileSize / 1024
  if (sizeKB < 100) {
    console.log(`📦 ${label}: Input already small (${sizeKB.toFixed(0)}KB), using aggressive compression`)
  }
  
  // Determine initial quality based on original file size
  let quality: number
  const fileSizeMB = originalFileSize / (1024 * 1024)
  
  // More aggressive quality for all sizes to prevent increase
  if (sizeKB < 100) {
    quality = 0.3 // Very small files need aggressive compression to not increase size
  } else if (fileSizeMB > 10) {
    quality = 0.3 // Very large files
  } else if (fileSizeMB > 5) {
    quality = 0.35 // Large files
  } else if (fileSizeMB > 2) {
    quality = 0.4 // Medium files
  } else {
    quality = 0.5 // Small-medium files
  }
  
  console.log(`🎯 ${label}: Starting compression (input: ${sizeKB.toFixed(0)}KB, initial quality: ${quality})`)
  
  let bestBlob: Blob | null = null
  let bestSize = Infinity
  
  // Try up to 5 attempts with decreasing quality
  for (let attempt = 0; attempt < 5; attempt++) {
    // Try AVIF first
    const avifBlob = await createAVIFBlob(canvas, quality)
    
    if (avifBlob) {
      const avifSizeKB = avifBlob.size / 1024
      console.log(`  AVIF attempt ${attempt + 1}: ${avifSizeKB.toFixed(0)}KB at quality ${quality}`)
      
      // Check if this is better than what we have
      if (avifBlob.size < bestSize) {
        bestBlob = avifBlob
        bestSize = avifBlob.size
      }
      
      // If size is acceptable AND not larger than original, use it
      if (avifBlob.size <= targetSize && avifBlob.size <= originalFileSize * 1.2) {
        console.log(`✅ ${label} AVIF: ${avifSizeKB.toFixed(0)}KB (target: ${(targetSize/1024).toFixed(0)}KB)`)
        return avifBlob
      }
    }
    
    // Try WebP at same quality
    const webpBlob = await createWebPBlob(canvas, quality)
    if (webpBlob) {
      const webpSizeKB = webpBlob.size / 1024
      console.log(`  WebP attempt ${attempt + 1}: ${webpSizeKB.toFixed(0)}KB at quality ${quality}`)
      
      // Check if WebP is better
      if (webpBlob.size < bestSize) {
        bestBlob = webpBlob
        bestSize = webpBlob.size
      }
      
      // If WebP is smaller and acceptable, use it
      if (webpBlob.size <= targetSize && webpBlob.size <= originalFileSize * 1.2) {
        console.log(`✅ ${label} WebP: ${webpSizeKB.toFixed(0)}KB (target: ${(targetSize/1024).toFixed(0)}KB)`)
        return webpBlob
      }
    }
    
    // Reduce quality more aggressively
    quality = Math.max(0.1, quality - 0.1)
  }
  
  // Use the best result we found
  if (bestBlob) {
    const finalSizeKB = bestBlob.size / 1024
    if (bestBlob.size > originalFileSize * 1.5) {
      console.warn(`⚠️ ${label}: Compressed size (${finalSizeKB.toFixed(0)}KB) is larger than original (${sizeKB.toFixed(0)}KB)`)
    } else {
      console.log(`✅ ${label} final: ${finalSizeKB.toFixed(0)}KB`)
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

// Resize image with strict size enforcement
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
  
  // Start with very low quality for strict size enforcement
  let quality = 0.3
  let bestBlob: Blob | null = null
  let attempts = 0
  const maxAttempts = 10
  
  console.log(`🖼️ Resizing to ${size}px with target ${(targetSize/1024).toFixed(0)}KB`)
  
  while (attempts < maxAttempts && quality >= 0.05) {
    // Try AVIF
    const avifBlob = await createAVIFBlob(canvas, quality)
    if (avifBlob && avifBlob.size <= targetSize) {
      console.log(`  ✅ AVIF at ${quality}: ${(avifBlob.size/1024).toFixed(0)}KB`)
      return avifBlob
    }
    
    // Try WebP
    const webpBlob = await createWebPBlob(canvas, quality)
    if (webpBlob && webpBlob.size <= targetSize) {
      console.log(`  ✅ WebP at ${quality}: ${(webpBlob.size/1024).toFixed(0)}KB`)
      return webpBlob
    }
    
    // Track best result
    if (avifBlob && (!bestBlob || avifBlob.size < bestBlob.size)) {
      bestBlob = avifBlob
    }
    if (webpBlob && (!bestBlob || webpBlob.size < bestBlob.size)) {
      bestBlob = webpBlob
    }
    
    // Log attempt
    if (avifBlob || webpBlob) {
      const size = avifBlob ? avifBlob.size : webpBlob!.size
      console.log(`  Attempt ${attempts + 1}: ${(size/1024).toFixed(0)}KB at quality ${quality} - too large`)
    }
    
    // Reduce quality more aggressively
    quality -= 0.05
    attempts++
  }
  
  // If we couldn't meet target, use smallest we found
  if (bestBlob) {
    console.warn(`  ⚠️ Could not meet target ${(targetSize/1024).toFixed(0)}KB, using ${(bestBlob.size/1024).toFixed(0)}KB`)
    return bestBlob
  }
  
  // Last resort: Create at minimum quality
  const finalBlob = await createAVIFBlob(canvas, 0.05) || await createWebPBlob(canvas, 0.1)
  if (finalBlob) {
    console.warn(`  ⚠️ Using minimum quality: ${(finalBlob.size/1024).toFixed(0)}KB`)
    return finalBlob
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