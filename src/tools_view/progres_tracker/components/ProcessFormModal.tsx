"use client";

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Textarea } from './textarea'
import { Checkbox } from './checkbox'
import { Save, X, Plus, Edit } from 'lucide-react'

interface ProcessFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { name: string; notes?: string; completed: boolean }) => void
  process?: any
  title: string
  isSubProcess: boolean
}

export function ProcessFormModal({
  isOpen,
  onClose,
  onSave,
  process,
  title,
  isSubProcess
}: ProcessFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    notes: '',
    completed: false
  })

  useEffect(() => {
    if (process) {
      setFormData({
        name: process.name || '',
        notes: process.notes || '',
        completed: process.completed || false
      })
    } else {
      setFormData({
        name: '',
        notes: '',
        completed: false
      })
    }
  }, [process, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-2 border-gray-200 shadow-2xl max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {process ? <Edit className="w-5 h-5 text-blue-500" /> : <Plus className="w-5 h-5 text-green-500" />}
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="processName" className="text-sm font-medium text-gray-700">
              {isSubProcess ? 'Sub-Process' : 'Process'} Name *
            </Label>
            <Input
              id="processName"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder={`Enter ${isSubProcess ? 'sub-process' : 'process'} name`}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-h-[80px]"
              placeholder="Add any additional notes..."
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="completed"
              checked={formData.completed}
              onCheckedChange={(checked) => handleInputChange('completed', checked as boolean)}
              className="border-2 border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
            />
            <Label htmlFor="completed" className="text-sm font-medium text-gray-700 cursor-pointer">
              Mark as completed
            </Label>
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