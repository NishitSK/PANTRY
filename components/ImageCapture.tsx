'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/shadcn-button'
import { Camera, Image as ImageIcon, X, ScanLine, FileText } from 'lucide-react'
import { createWorker } from 'tesseract.js'

interface ImageCaptureProps {
  onImageCaptured?: (file: File) => void
  onAnalysisComplete?: (data: any) => void
}

export default function ImageCapture({ onImageCaptured, onAnalysisComplete }: ImageCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  // OCR Mode is now implicit/always on for the receipt scanner
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Please select an image under 5MB.')
        return
      }
      
      setCapturedFile(file)
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      if (onImageCaptured) {
        onImageCaptured(file)
      }
    }
  }

  const handleClear = () => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
    setCapturedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // 1. Resize (Max 1500px)
        const MAX_DIMENSION = 1500
        let width = img.width
        let height = img.height
        
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width
            width = MAX_DIMENSION
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height
            height = MAX_DIMENSION
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        if (!ctx) {
          resolve(URL.createObjectURL(file))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        
        // 2. Grayscale & Contrast
        const imageData = ctx.getImageData(0, 0, width, height)
        const data = imageData.data
        const contrast = 50 // Contrast factor (0-100+)
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))

        for (let i = 0; i < data.length; i += 4) {
          // Grayscale
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
          
          // Contrast
          const c = factor * (avg - 128) + 128
          
          data[i] = c     // R
          data[i + 1] = c // G
          data[i + 2] = c // B
        }
        
        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const performOcr = async (imageInput: File | string): Promise<string> => {
    const worker = await createWorker('eng');
    const ret = await worker.recognize(imageInput);
    await worker.terminate();
    return ret.data.text;
  }

  const handleAnalyze = async () => {
    if (!capturedFile) return
    
    setAnalyzing(true)
    
    try {
      const formData = new FormData()
      formData.append('image', capturedFile) // Send original image to backend for storage/display if needed

      // Always perform OCR since "Vision Mode" is deprecated
      try {
        // Preprocess image for better OCR
        console.log("Preprocessing image...")
        const preprocessedImage = await preprocessImage(capturedFile)
        
        console.log("Starting OCR...")
        const text = await performOcr(preprocessedImage);
        console.log("Extracted Text:", text);
        formData.append('extractedText', text);
      } catch (ocrError) {
        console.error("OCR Failed:", ocrError);
        alert("Could not read text from image. Please try a clearer photo.");
        setAnalyzing(false);
        return; 
      }

      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      if (onAnalysisComplete) {
        onAnalysisComplete(data)
      }
    } catch (error: any) {
      console.error('Analysis error:', error)
      alert(error.message || 'Failed to analyze image')
    } finally {
      setAnalyzing(false)
    }
  }

  const triggerCamera = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full bg-card text-card-foreground rounded-xl border border-border overflow-hidden shadow-sm transition-all">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2 text-foreground text-sm">
          <ScanLine className="h-4 w-4 text-primary" />
          Receipt Scanner
        </h3>
        <span className="text-[10px] font-medium px-2 py-0.5 bg-muted text-muted-foreground rounded-full border border-border">
          Text Recognition
        </span>
      </div>

      <div className="p-3">
        {!preview ? (
          <div 
            onClick={triggerCamera}
            className="border-2 border-dashed border-muted-foreground/20 rounded-lg py-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors gap-2"
          >
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <Camera className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Take photo / Upload
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Scan a receipt or grocery list
              </p>
            </div>
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black/5">
            <div className="aspect-video relative w-full">
               <img 
                 src={preview} 
                 alt="Preview" 
                 className="w-full h-full object-contain"
               />
            </div>
            
            <div className="absolute top-2 right-2">
              <button 
                onClick={handleClear}
                className="p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-card border-t border-border flex justify-end gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClear}
              >
                Retake
              </Button>
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>Reading Text...</>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Extract Items
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        
        {/* Hidden input for camera/file */}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  )
}
