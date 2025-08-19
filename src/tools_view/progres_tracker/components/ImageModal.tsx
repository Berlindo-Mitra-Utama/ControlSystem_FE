import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { Button } from './button'
import { X, Image as ImageIcon } from 'lucide-react'
import { useTheme } from '../../../contexts/ThemeContext'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  partName: string
}

export function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  partName
}: ImageModalProps) {
  const { isDarkMode } = useTheme()

  // Light mode colors
  const modalColors = {
    bg: 'bg-white',
    border: 'border-gray-200',
    text: 'text-gray-900',
    button: {
      bg: 'bg-gray-100',
      hover: 'hover:bg-gray-200',
      text: 'text-gray-700',
      border: 'border-gray-300'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${modalColors.bg} border-2 ${modalColors.border} shadow-2xl max-w-4xl`}>
        <DialogHeader className="pb-4">
          <DialogTitle className={`text-xl font-bold ${modalColors.text} flex items-center gap-2`}>
            <ImageIcon className="w-6 h-6 text-blue-500" />
            {partName} - Image Preview
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          {imageUrl && imageUrl.trim() !== '' ? (
            <div className="flex justify-center">
              <img
                src={imageUrl}
                alt={partName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg border border-gray-200"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
                  if (fallback) fallback.classList.remove('hidden');
                }}
                {...(imageUrl.startsWith('data:') ? {} : { crossOrigin: "anonymous" })}
              />
              <div className="image-fallback hidden absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <ImageIcon className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium">Image not available</p>
                <p className="text-sm text-gray-500">The image could not be loaded</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <ImageIcon className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">No image available</p>
              <p className="text-sm text-gray-500">This part doesn't have an image</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-4">
          <Button
            onClick={onClose}
            className={`${modalColors.button.bg} ${modalColors.button.hover} ${modalColors.button.text} ${modalColors.button.border} border-2 shadow-md hover:shadow-lg transition-all duration-200`}
          >
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
