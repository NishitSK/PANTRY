'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/shadcn-button'
import { Camera, Image as ImageIcon, X, Sparkles } from 'lucide-react'
import Image from 'next/image'

interface ImageCaptureProps {
  onImageCaptured?: (file: File) => void
  onAnalysisComplete?: (data: any) => void
}

export default function ImageCapture({ onImageCaptured, onAnalysisComplete }: ImageCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
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

  const handleAnalyze = async () => {
    if (!capturedFile) return
    
    setAnalyzing(true)
    
    try {
      const formData = new FormData()
      formData.append('image', capturedFile)

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
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          AI Smart Scan
        </h3>
        <span className="text-[10px] font-medium px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
          Beta
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
                Scan receipt or item
              </p>
            </div>
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black/5">
            <div className="aspect-video relative w-full">
               {/* Using regular img for preview to avoid dealing with next/image complexity for blobs */}
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
                  <>Processing...</>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze with AI
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
