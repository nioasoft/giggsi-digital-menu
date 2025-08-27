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
  
  // Convert original to AVIF/WebP if it's not already in modern format
  let original: File | Blob = file
  if (file.type !== 'image/avif' && file.type !== 'image/webp') {
    // Convert original to AVIF for best compression
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    
    original = await new Promise((resolve) => {
      // Try AVIF first
      canvas.toBlob(
        (avifBlob) => {
          if (avifBlob) {
            console.log(`📁 Original converted to AVIF: ${(avifBlob.size / 1024).toFixed(1)}KB (was ${(file.size / 1024).toFixed(1)}KB)`)
            resolve(avifBlob)
          } else {
            // Fallback to WebP
            canvas.toBlob(
              (webpBlob) => {
                if (webpBlob) {
                  console.log(`📁 Original converted to WebP: ${(webpBlob.size / 1024).toFixed(1)}KB (was ${(file.size / 1024).toFixed(1)}KB)`)
                  resolve(webpBlob)
                } else {
                  console.warn('⚠️ Could not convert to modern format, keeping original')
                  resolve(file)
                }
              },
              'image/webp',
              0.85 // Higher quality for original
            )
          }
        },
        'image/avif',
        0.75 // Good quality for AVIF original
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
  
  // Convert to blob with AVIF as primary format for best compression
  return new Promise((resolve, reject) => {
    // Try AVIF first - best compression (50-70% smaller than JPEG)
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
                console.log(`⚠️ WebP fallback: ${maxWidth}px - Size: ${(webpBlob.size / 1024).toFixed(1)}KB`)
                resolve(webpBlob)
              } else {
                // No JPEG fallback - modern formats only
                reject(new Error('Browser does not support modern image formats (AVIF/WebP)'))
              }
            },
            'image/webp',
            0.8 // Good quality for WebP fallback
          )
        }
      },
      'image/avif',
      0.65 // Optimal quality for AVIF (great compression at this level)
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