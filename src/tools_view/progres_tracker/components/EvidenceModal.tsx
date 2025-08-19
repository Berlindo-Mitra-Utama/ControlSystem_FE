"use client";

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Textarea } from './textarea'
import { Badge } from './badge'
import { Upload, FileText, Image, Download, Trash2, Plus, X } from 'lucide-react'

interface Evidence {
  id: string
  name: string
  type: 'image' | 'file'
  url: string
  uploadedAt: string
  size?: number
  notes?: string
}

interface EvidenceModalProps {
  isOpen: boolean
  onClose: () => void
  processName: string
  evidence: Evidence[]
  onEvidenceChange: (evidence: Evidence[]) => void
  processId?: string
  subProcessId?: string
  partId?: string
  categoryId?: string
}

export function EvidenceModal({
  isOpen,
  onClose,
  processName,
  evidence,
  onEvidenceChange,
  processId,
  subProcessId,
  partId,
  categoryId
}: EvidenceModalProps) {
  const [newEvidence, setNewEvidence] = useState({
    name: '',
    type: 'file' as 'image' | 'file',
    notes: ''
  })

  const [isAdding, setIsAdding] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Check if evidence name is provided
    if (!newEvidence.name.trim()) {
      alert('Please enter evidence name first')
      return
    }

    setUploading(true)
    
    // Simulate file upload process
    setTimeout(() => {
      const file = files[0]
      const evidenceItem: Evidence = {
        id: Date.now().toString(),
        name: newEvidence.name.trim(), // Use custom evidence name from user
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: URL.createObjectURL(file), // Create blob URL for preview
        uploadedAt: new Date().toISOString(),
        size: file.size,
        notes: newEvidence.notes.trim() || undefined
      }

      onEvidenceChange([...evidence, evidenceItem])
      setNewEvidence({ name: '', type: 'file', notes: '' })
      setIsAdding(false)
      setUploading(false)
      
      // Reset file input
      event.target.value = ''
    }, 1000)
  }

  const handleRemoveEvidence = (id: string) => {
    onEvidenceChange(evidence.filter(item => item.id !== id))
  }

  const getFileIcon = (type: string) => {
    if (type === 'image') {
      return <Image className="w-4 h-4 text-blue-500" />
    }
    return <FileText className="w-4 h-4 text-green-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-2 border-gray-200 shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            Evidence for {processName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full">
          {/* Add New Evidence Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Add New Evidence</h3>
              <Button
                onClick={() => setIsAdding(!isAdding)}
                className="bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-400 shadow-md hover:shadow-lg transition-all duration-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                {isAdding ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                {isAdding ? 'Cancel' : 'Add Evidence'}
              </Button>
            </div>
            
            {isAdding && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="evidenceName" className="text-sm font-medium text-gray-700">
                      Evidence Name *
                    </Label>
                    <Input
                      id="evidenceName"
                      value={newEvidence.name}
                      onChange={(e) => setNewEvidence(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter evidence name"
                      className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="evidenceType" className="text-sm font-medium text-gray-700">
                      Type *
                    </Label>
                    <select
                      id="evidenceType"
                      value={newEvidence.type}
                      onChange={(e) => setNewEvidence(prev => ({ ...prev, type: e.target.value as 'image' | 'file' }))}
                      className="w-full border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md px-3 py-2 transition-all duration-200"
                    >
                      <option value="file">File</option>
                      <option value="image">Image</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="evidenceNotes" className="text-sm font-medium text-gray-700">
                    Notes
                  </Label>
                  <Textarea
                    id="evidenceNotes"
                    value={newEvidence.notes}
                    onChange={(e) => setNewEvidence(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any additional notes..."
                    className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-h-[60px]"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="fileUpload" className="text-sm font-medium text-gray-700">
                    Upload File *
                  </Label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      id="fileUpload"
                      accept={newEvidence.type === 'image' ? 'image/*' : '*'}
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="fileUpload"
                      className={`flex items-center justify-center px-4 py-2 rounded-md cursor-pointer transition-all duration-200 border-2 ${
                        uploading
                          ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-600 text-white border-blue-400 hover:border-blue-500 shadow-md hover:shadow-lg'
                      }`}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Choose File'}
                    </label>
                    <span className="text-sm text-gray-500">
                      {uploading ? 'Please wait...' : 'Click to select file'}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    onClick={() => setIsAdding(false)}
                    disabled={uploading}
                    className="bg-green-500 hover:bg-green-600 text-white border-2 border-green-400 shadow-md hover:shadow-lg transition-all duration-200 px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Add Evidence'}
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Evidence List */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Current Evidence ({evidence.length})</h3>
            
            {evidence.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium">No evidence added yet</p>
                <p className="text-sm">Click "Add Evidence" to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {evidence.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getFileIcon(item.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Badge variant="outline" className="text-xs">
                            {item.type === 'image' ? 'Image' : 'File'}
                          </Badge>
                          <span>{formatFileSize(item.size || 0)}</span>
                          <span>•</span>
                          <span>{new Date(item.uploadedAt).toLocaleDateString()}</span>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-gray-500 mt-1 italic">"{item.notes}"</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => window.open(item.url, '_blank')}
                        className="bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-400 shadow-sm hover:shadow-md transition-all duration-200 px-2 py-1 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRemoveEvidence(item.id)}
                        className="bg-red-500 hover:bg-red-600 text-white border-2 border-red-400 shadow-sm hover:shadow-md transition-all duration-200 px-2 py-1 text-xs"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex justify-end pt-4 border-t-2 border-gray-200">
            <Button
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2 rounded-md font-medium"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 