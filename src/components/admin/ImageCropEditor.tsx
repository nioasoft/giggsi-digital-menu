import React, { useState, useRef, useEffect } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Crop as CropIcon, Check, X } from 'lucide-react'

interface ImageCropEditorProps {
  imageFile: File
  onCropComplete: (croppedImageBlob: Blob) => void
  onCancel: () => void
  aspectRatio?: number // Default 1 for square
}

export const ImageCropEditor: React.FC<ImageCropEditorProps> = ({
  imageFile,
  onCropComplete,
  onCancel,
  aspectRatio = 1
}) => {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [imageSrc, setImageSrc] = useState<string>('')
  const imgRef = useRef<HTMLImageElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Create object URL for the image
    const url = URL.createObjectURL(imageFile)
    setImageSrc(url)
    
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [imageFile])

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    
    // Create a centered square crop
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90, // Start with 90% of the image
        },
        aspectRatio,
        width,
        height
      ),
      width,
      height
    )
    
    setCrop(crop)
  }

  // Helper functions for smart compression
  function calculateBytesPerPixel(fileSize: number, width: number, height: number): number {
    return fileSize / (width * height)
  }

  function getMinimumQuality(fileSizeKB: number): number {
    if (fileSizeKB < 50) return 0.7   // Small files: preserve quality
    if (fileSizeKB < 200) return 0.5  // Medium files: balanced
    if (fileSizeKB < 1000) return 0.4 // Large files: moderate
    return 0.3                        // Very large: aggressive
  }

  async function generateCroppedImage() {
    const image = imgRef.current
    const canvas = previewCanvasRef.current
    
    if (!image || !canvas || !completedCrop) {
      return
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      return
    }

    // Set canvas size to the actual crop size
    canvas.width = completedCrop.width * scaleX
    canvas.height = completedCrop.height * scaleY

    ctx.imageSmoothingQuality = 'high'

    // Draw the cropped image
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    )

    // Calculate compression parameters
    const inputFileSize = imageFile.size / 1024 // Size in KB
    const totalPixels = canvas.width * canvas.height
    const bytesPerPixel = calculateBytesPerPixel(imageFile.size, canvas.width, canvas.height)
    const minQuality = getMinimumQuality(inputFileSize)
    
    // Determine starting quality based on input efficiency
    let quality: number
    if (bytesPerPixel < 0.3) {
      quality = 0.85 // Already well-compressed, preserve quality
    } else if (bytesPerPixel < 0.5) {
      quality = 0.75 // Moderately compressed
    } else if (bytesPerPixel < 1.0) {
      quality = 0.65 // Lightly compressed
    } else {
      quality = 0.55 // Uncompressed or inefficient
    }
    
    // Respect minimum quality
    quality = Math.max(quality, minQuality)
    
    console.log(`🖼️ Cropping: ${canvas.width}x${canvas.height}`)
    console.log(`  Input: ${inputFileSize.toFixed(0)}KB (${bytesPerPixel.toFixed(2)} bytes/pixel)`)
    console.log(`  Starting quality: ${quality.toFixed(2)}, minimum: ${minQuality.toFixed(2)}`)
    
    // Smart compression helper
    const tryCompression = async (format: string, q: number): Promise<Blob | null> => {
      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob),
          format,
          q
        )
      })
    }
    
    // Smart compression with quality preservation
    const attemptCompression = async () => {
      let bestBlob: Blob | null = null
      let bestSize = Infinity
      const maxAttempts = 5
      let attempts = 0
      
      // If already optimized, try high quality first
      if (bytesPerPixel < 0.4) {
        const highQualityAvif = await tryCompression('image/avif', 0.85)
        if (highQualityAvif && highQualityAvif.size <= imageFile.size * 1.2) {
          console.log(`  ✨ Preserved quality: AVIF @0.85 = ${(highQualityAvif.size/1024).toFixed(0)}KB`)
          onCropComplete(highQualityAvif)
          return
        }
      }
      
      // Progressive quality reduction respecting minimum
      while (attempts < maxAttempts && quality >= minQuality) {
        // Try AVIF
        const avifBlob = await tryCompression('image/avif', quality)
        if (avifBlob) {
          const avifBytesPerPixel = avifBlob.size / totalPixels
          console.log(`  AVIF @${quality.toFixed(2)}: ${(avifBlob.size/1024).toFixed(0)}KB (${avifBytesPerPixel.toFixed(2)} bytes/pixel)`)
          
          if (avifBlob.size < bestSize) {
            bestBlob = avifBlob
            bestSize = avifBlob.size
          }
          
          // Accept if not significantly larger than input
          if (avifBlob.size <= imageFile.size * 1.2) {
            console.log(`  ✅ Accepted AVIF: ${(avifBlob.size/1024).toFixed(0)}KB`)
            onCropComplete(avifBlob)
            return
          }
        }
        
        // Try WebP
        const webpBlob = await tryCompression('image/webp', quality)
        if (webpBlob) {
          const webpBytesPerPixel = webpBlob.size / totalPixels
          console.log(`  WebP @${quality.toFixed(2)}: ${(webpBlob.size/1024).toFixed(0)}KB (${webpBytesPerPixel.toFixed(2)} bytes/pixel)`)
          
          if (webpBlob.size < bestSize) {
            bestBlob = webpBlob
            bestSize = webpBlob.size
          }
          
          // Accept if not significantly larger than input
          if (webpBlob.size <= imageFile.size * 1.2) {
            console.log(`  ✅ Accepted WebP: ${(webpBlob.size/1024).toFixed(0)}KB`)
            onCropComplete(webpBlob)
            return
          }
        }
        
        // Reduce quality gradually, respecting minimum
        quality = Math.max(minQuality, quality - 0.1)
        attempts++
      }
      
      // Use best result found
      if (bestBlob) {
        const finalBytesPerPixel = bestBlob.size / totalPixels
        console.log(`  Final: ${(bestBlob.size/1024).toFixed(0)}KB (${finalBytesPerPixel.toFixed(2)} bytes/pixel)`)
        if (bestBlob.size > imageFile.size * 1.2) {
          console.warn(`  ⚠️ Output (${(bestBlob.size/1024).toFixed(0)}KB) larger than input (${inputFileSize.toFixed(0)}KB)`)
        }
        onCropComplete(bestBlob)
      }
    }
    
    attemptCompression()
  }

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="h-5 w-5" />
            Crop Image - 1:1 Square Ratio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Crop Area */}
          <div className="max-h-[60vh] overflow-auto rounded-lg border bg-muted/20">
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imageSrc}
                  onLoad={onImageLoad}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </ReactCrop>
            )}
          </div>

          {/* Hidden canvas for preview generation */}
          <canvas
            ref={previewCanvasRef}
            style={{ display: 'none' }}
          />

          {/* Instructions */}
          <div className="text-sm text-muted-foreground">
            <p>• Drag to move the selection</p>
            <p>• Drag corners to resize (maintains 1:1 ratio)</p>
            <p>• Click "Apply Crop" when ready</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={generateCroppedImage}
            disabled={!completedCrop}
            className="bg-giggsi-gold hover:bg-giggsi-gold/90 text-black"
          >
            <Check className="h-4 w-4 mr-2" />
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}