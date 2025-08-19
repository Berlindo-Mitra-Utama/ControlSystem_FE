import React from 'react'
import { Button } from './button'
import { Save, CheckCircle } from 'lucide-react'
import { useTheme } from '../../../contexts/ThemeContext'

interface SaveButtonProps {
  onClick: () => void
  isSaving: boolean
  hasUnsavedChanges: boolean
}

export function SaveButton({
  onClick,
  isSaving,
  hasUnsavedChanges
}: SaveButtonProps) {
  const { isDarkMode } = useTheme()

  // Light mode colors with strong contrast
  const buttonColors = {
    primary: {
      bg: 'bg-blue-500',
      hover: 'hover:bg-blue-600',
      text: 'text-white',
      border: 'border-transparent'
    },
    success: {
      bg: 'bg-green-500',
      hover: 'hover:bg-green-600',
      text: 'text-white',
      border: 'border-transparent'
    },
    disabled: {
      bg: 'bg-gray-400',
      hover: 'hover:bg-gray-400',
      text: 'text-white',
      border: 'border-transparent'
    }
  }

  const getButtonStyle = () => {
    if (isSaving) {
      return buttonColors.disabled
    }
    if (hasUnsavedChanges) {
      return buttonColors.primary
    }
    return buttonColors.success
  }

  const getButtonText = () => {
    if (isSaving) {
      return 'Saving...'
    }
    if (hasUnsavedChanges) {
      return 'Save Changes'
    }
    return 'All Saved!'
  }

  const getIcon = () => {
    if (isSaving) {
      return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    }
    if (hasUnsavedChanges) {
      return <Save className="w-4 h-4" />
    }
    return <CheckCircle className="w-4 h-4" />
  }

  const buttonStyle = getButtonStyle()

  return (
    <Button
      size="sm"
      onClick={onClick}
      disabled={isSaving || !hasUnsavedChanges}
      className={`w-full h-11 ${buttonStyle.bg} ${buttonStyle.hover} ${buttonStyle.text} ${buttonStyle.border} text-sm font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 ${hasUnsavedChanges ? 'border-blue-400' : 'border-green-400'}`}
    >
      {getIcon()}
      <span className="ml-2">{getButtonText()}</span>
    </Button>
  )
}
