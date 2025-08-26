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

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob)
        }
      },
      imageFile.type || 'image/jpeg',
      0.95
    )
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