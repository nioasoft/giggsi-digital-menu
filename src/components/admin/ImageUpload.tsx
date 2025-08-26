import React, { useState, useCallback } from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { processImage, uploadProcessedImages, processImageFromBlob } from '@/lib/imageProcessor'
import { ImageCropEditor } from './ImageCropEditor'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  onUpload: (urls: { original: string; small: string; medium: string; large: string }) => void
  category?: string
  itemName?: string
  maxSize?: number // in MB
  className?: string
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  category = 'general',
  itemName = 'item',
  maxSize = 10,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string>('')
  const [preview, setPreview] = useState<string>('')
  const [showCropEditor, setShowCropEditor] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > maxSize) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    setError('')
    setSelectedFile(file)
    setShowCropEditor(true)
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropEditor(false)
    setPreview(URL.createObjectURL(croppedBlob))
    setUploading(true)
    setProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      // Create a File object from the blob for processing
      const croppedFile = new File([croppedBlob], selectedFile?.name || 'image.jpg', {
        type: croppedBlob.type || 'image/jpeg'
      })

      // Process and upload the cropped image
      const urls = await uploadProcessedImages(croppedFile, category, itemName)
      
      clearInterval(progressInterval)
      setProgress(100)
      
      // Call callback with URLs
      onUpload(urls)
      
      // Reset after short delay
      setTimeout(() => {
        setPreview('')
        setProgress(0)
        setUploading(false)
        setSelectedFile(null)
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
      setUploading(false)
      setProgress(0)
    }
  }

  const handleCancelCrop = () => {
    setShowCropEditor(false)
    setSelectedFile(null)
  }

  const clearPreview = () => {
    setPreview('')
    setError('')
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Crop Editor Modal */}
      {showCropEditor && selectedFile && (
        <ImageCropEditor
          imageFile={selectedFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
          aspectRatio={1} // Always 1:1 square
        />
      )}

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          {!uploading && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={clearPreview}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <div className="text-white text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">Processing image...</p>
                <Progress value={progress} className="w-32 mt-2" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragging ? "border-giggsi-gold bg-giggsi-gold/10" : "border-border",
            "hover:border-giggsi-gold hover:bg-giggsi-gold/5"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          
          <div className="flex flex-col items-center gap-3">
            {isDragging ? (
              <Upload className="h-10 w-10 text-giggsi-gold animate-pulse" />
            ) : (
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            )}
            
            <div>
              <p className="font-medium">
                {isDragging ? 'Drop image here' : 'Click or drag image to upload'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                JPG, PNG, WEBP up to {maxSize}MB
              </p>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}