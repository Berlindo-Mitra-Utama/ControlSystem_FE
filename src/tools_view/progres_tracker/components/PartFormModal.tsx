"use client";

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Save, X, Upload, Image, Trash2 } from 'lucide-react'

interface PartFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { partName: string; partNumber: string; customer: string; partImage?: File }) => void
  part?: any
  title: string
}

export function PartFormModal({
  isOpen,
  onClose,
  onSave,
  part,
  title
}: PartFormModalProps) {
  const [formData, setFormData] = useState({
    partName: '',
    partNumber: '',
    customer: ''
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  useEffect(() => {
    if (part) {
      setFormData({
        partName: part.partName || '',
        partNumber: part.partNumber || '',
        customer: part.customer || ''
      })
      // Set preview for existing image
      if (part.partImageUrl) {
        setPreviewUrl(part.partImageUrl)
      }
    } else {
      setFormData({
        partName: '',
        partNumber: '',
        customer: ''
      })
      setPreviewUrl('')
    }
    setSelectedImage(null)
  }, [part, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      partImage: selectedImage || undefined
    })
    onClose()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }

      setSelectedImage(file)
      
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setPreviewUrl('')
    // Clear the file input
    const fileInput = document.getElementById('partImage') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-2 border-gray-200 shadow-2xl max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Save className="w-5 h-5 text-blue-500" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="partName" className="text-sm font-medium text-gray-700">
              Part Name *
            </Label>
            <Input
              id="partName"
              type="text"
              value={formData.partName}
              onChange={(e) => handleInputChange('partName', e.target.value)}
              required
              className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="Enter part name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="partNumber" className="text-sm font-medium text-gray-700">
              Part Number *
            </Label>
            <Input
              id="partNumber"
              type="text"
              value={formData.partNumber}
              onChange={(e) => handleInputChange('partNumber', e.target.value)}
              required
              className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="Enter part number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customer" className="text-sm font-medium text-gray-700">
              Customer *
            </Label>
            <Input
              id="customer"
              type="text"
              value={formData.customer}
              onChange={(e) => handleInputChange('customer', e.target.value)}
              required
              className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="Enter customer name"
            />
          </div>

          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="partImage" className="text-sm font-medium text-gray-700">
              Part Image
            </Label>
            
            {/* Image Preview */}
            {previewUrl && (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Part preview"
                  className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
                />
                <Button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
            
            {/* Upload Button */}
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="partImage"
                className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all duration-200"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
                <input
                  id="partImage"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 px-4 py-2 rounded-md font-medium"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-400 shadow-md hover:shadow-lg transition-all duration-200 px-4 py-2 rounded-md font-medium"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 