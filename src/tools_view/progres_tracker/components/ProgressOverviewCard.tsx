import React from 'react'
import { Button } from './button'
import { Edit, Trash2, Image } from 'lucide-react'
import { useTheme } from '../../../contexts/ThemeContext'

interface ProgressOverviewCardProps {
  part: any
  onEditPart: () => void
  onDeletePart: () => void
  onViewImage: () => void
  calculateOverallProgress: (part: any) => number
  saveButton?: React.ReactNode
}

export function ProgressOverviewCard({
  part,
  onEditPart,
  onDeletePart,
  onViewImage,
  calculateOverallProgress,
  saveButton
}: ProgressOverviewCardProps) {
  const { isDarkMode } = useTheme()

  // Dynamic UI colors based on theme with brighter colors and strong borders
  const uiColors = {
    bg: {
      primary: isDarkMode ? 'bg-slate-100' : 'bg-white',
      card: isDarkMode ? 'bg-slate-200' : 'bg-gray-50',
      secondary: isDarkMode ? 'bg-slate-300' : 'bg-gray-100',
      tertiary: isDarkMode ? 'bg-slate-400' : 'bg-gray-200'
    },
    border: {
      primary: isDarkMode ? 'border-slate-400' : 'border-gray-300',
      secondary: isDarkMode ? 'border-slate-500' : 'border-gray-400',
      tertiary: isDarkMode ? 'border-slate-600' : 'border-gray-500',
      accent: isDarkMode ? 'border-blue-500' : 'border-blue-600',
      error: isDarkMode ? 'border-red-500' : 'border-red-600'
    },
    text: {
      primary: isDarkMode ? 'text-slate-800' : 'text-gray-900',
      secondary: isDarkMode ? 'text-slate-700' : 'text-gray-700',
      tertiary: isDarkMode ? 'text-slate-600' : 'text-gray-600',
      accent: isDarkMode ? 'text-blue-600' : 'text-blue-700',
      error: isDarkMode ? 'text-red-600' : 'text-red-700'
    },
    button: {
      primary: {
        bg: isDarkMode ? 'bg-blue-500' : 'bg-blue-500',
        hover: isDarkMode ? 'hover:bg-blue-600' : 'hover:bg-blue-600',
        text: 'text-white',
        border: 'border-transparent'
      },
      secondary: {
        bg: isDarkMode ? 'bg-slate-500' : 'bg-gray-500',
        hover: isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-600',
        text: 'text-white',
        border: 'border-transparent'
      },
      danger: {
        bg: isDarkMode ? 'bg-red-500' : 'bg-red-500',
        hover: isDarkMode ? 'hover:bg-red-600' : 'hover:bg-red-600',
        text: 'text-white',
        border: 'border-transparent'
      }
    }
  }

  const overallProgress = calculateOverallProgress(part)

  return (
    <div className="w-full">
      {/* Main Container with bright colors and strong borders */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-4 border-blue-200 shadow-xl p-6">
        
        {/* Content Layout - Mobile First */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Section: Part Information & Progress */}
          <div className="flex-1 space-y-4">
            
            {/* Part Details Card with bright colors and strong borders */}
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl border-3 border-blue-300 p-4 shadow-lg">
              <h3 className="text-base font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                Part Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Part Name */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-blue-700 uppercase tracking-wider font-bold">Part Name</label>
                  <div className="p-3 bg-white rounded-lg border-2 border-blue-200 shadow-sm">
                    <span className="text-base font-semibold text-slate-800 break-words">{part.partName}</span>
                  </div>
                </div>
                
                {/* Part Number */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-blue-700 uppercase tracking-wider font-bold">Part Number</label>
                  <div className="p-3 bg-white rounded-lg border-2 border-blue-200 shadow-sm">
                    <span className="text-base font-mono font-semibold text-emerald-600 break-words">{part.partNumber}</span>
                  </div>
                </div>
                
                {/* Customer */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-blue-700 uppercase tracking-wider font-bold">Customer</label>
                  <div className="p-3 bg-white rounded-lg border-2 border-blue-200 shadow-sm">
                    <span className="text-base font-semibold text-orange-600 break-words">{part.customer}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress Overview Card with bright colors and strong borders */}
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl border-3 border-indigo-300 p-4 shadow-lg">
              <h3 className="text-base font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                Progress Overview
              </h3>
              
              <div className="flex items-center justify-between">
                {/* Progress Stats */}
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-indigo-900">
                    {overallProgress}%
                  </div>
                  <div className="text-sm text-indigo-700 font-medium">Overall Progress</div>
                </div>
                
                {/* Progress Circle */}
                <div className="relative">
                  {(() => {
                    const percent = overallProgress
                    const r = 35
                    const stroke = 8
                    const c = 2 * Math.PI * r
                    const offset = c * (1 - percent / 100)
                    return (
                      <div className="relative w-24 h-24">
                        <svg viewBox="0 0 100 100" className="w-24 h-24 transform -rotate-90">
                          <defs>
                            <linearGradient id="overallGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                          </defs>
                          <circle cx="50" cy="50" r={r} stroke="#e0e7ff" strokeWidth={stroke} fill="none" />
                          <circle 
                            cx="50" cy="50" r={r} 
                            stroke="url(#overallGrad)" 
                            strokeWidth={stroke} 
                            fill="none" 
                            strokeLinecap="round" 
                            strokeDasharray={c} 
                            strokeDashoffset={offset}
                            className="transition-all duration-1000 ease-out drop-shadow-lg"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-xl font-bold text-indigo-900">{percent}%</div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Section: Image & Buttons */}
          <div className="flex flex-col items-center lg:items-end gap-4 lg:w-48">
            
            {/* Part Image */}
            {part.partImageUrl && part.partImageUrl.trim() !== '' && (
              <div className="flex-shrink-0">
                <div className="relative group">
                  <div className="w-40 h-40 bg-gradient-to-br from-white to-blue-50 rounded-xl overflow-hidden border-3 border-blue-300 cursor-pointer transition-all duration-300 hover:scale-105 hover:border-blue-500 hover:shadow-2xl shadow-lg"
                       onClick={onViewImage}>
                    <img
                      src={part.partImageUrl}
                      alt={part.partName}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                      onLoad={(e) => {
                        const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
                        if (fallback) fallback.classList.add('hidden');
                      }}
                      {...(part.partImageUrl.startsWith('data:') ? {} : { crossOrigin: "anonymous" })}
                    />
                    <div className="image-fallback absolute inset-0 flex items-center justify-center text-blue-400 hidden">
                      <Image className="w-8 h-8" />
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-600/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2">
                      <div className="text-white text-xs font-medium bg-blue-600/80 px-3 py-1 rounded-lg backdrop-blur-sm">
                        Click to view full size
                      </div>
                    </div>
                  </div>
                  
                  {/* Image Badge */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <Image className="w-3 h-3 text-white" />
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2 text-center font-medium">Click image to view full size</p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full">
              {/* Edit Part Button */}
              <Button
                size="sm"
                onClick={onEditPart}
                className={`w-full h-11 ${uiColors.button.secondary.bg} ${uiColors.button.secondary.hover} ${uiColors.button.secondary.text} ${uiColors.button.secondary.border} text-sm font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-slate-400`}
              >
                <Edit className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Edit Part</span>
                <span className="sm:hidden">Edit</span>
              </Button>
              
              {/* Delete Part Button */}
              <Button
                size="sm"
                onClick={onDeletePart}
                className={`w-full h-11 ${uiColors.button.danger.bg} ${uiColors.button.danger.hover} ${uiColors.button.danger.text} ${uiColors.button.danger.border} text-sm font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-red-400`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Delete Part</span>
                <span className="sm:hidden">Delete</span>
              </Button>
              
              {/* Save Button */}
              {saveButton && (
                <div className="w-full">
                  {saveButton}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
