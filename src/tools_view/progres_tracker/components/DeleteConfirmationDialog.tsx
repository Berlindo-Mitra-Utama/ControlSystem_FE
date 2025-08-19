"use client";

import React from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './alert-dialog'
import { Trash2, AlertTriangle } from 'lucide-react'

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  type: "process" | "subprocess" | "part"
  name?: string
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  type,
  name
}: DeleteConfirmationDialogProps) {
  const getTypeInfo = () => {
    switch (type) {
      case "part":
        return {
          title: "Delete Part",
          description: `Are you sure you want to delete "${name}"? This action cannot be undone and will remove all associated progress data.`,
          confirmText: "Delete Part",
          icon: <Trash2 className="w-5 h-5 text-red-500" />
        }
      case "process":
        return {
          title: "Delete Process",
          description: `Are you sure you want to delete "${name}"? This will remove the process and all its sub-processes.`,
          confirmText: "Delete Process",
          icon: <Trash2 className="w-5 h-5 text-red-500" />
        }
      case "subprocess":
        return {
          title: "Delete Sub-Process",
          description: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
          confirmText: "Delete Sub-Process",
          icon: <Trash2 className="w-5 h-5 text-red-500" />
        }
      default:
        return {
          title: "Delete Item",
          description: "Are you sure you want to delete this item? This action cannot be undone.",
          confirmText: "Delete",
          icon: <Trash2 className="w-5 h-5 text-red-500" />
        }
    }
  }

  const typeInfo = getTypeInfo()

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-white border-2 border-gray-200 shadow-2xl max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            {typeInfo.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 mt-2">
            {typeInfo.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel 
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 px-4 py-2 rounded-md font-medium"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white border-2 border-red-400 shadow-md hover:shadow-lg transition-all duration-200 px-4 py-2 rounded-md font-medium"
          >
            {typeInfo.icon}
            <span className="ml-2">{typeInfo.confirmText}</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 