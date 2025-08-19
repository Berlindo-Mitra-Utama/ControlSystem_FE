import React from 'react';
import { Button } from './button';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';

interface ManageProgressHeaderProps {
  showDetailedProcesses: boolean;
  onToggleDetailedProcesses: () => void;
}

export const ManageProgressHeader: React.FC<ManageProgressHeaderProps> = ({
  showDetailedProcesses,
  onToggleDetailedProcesses
}) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="w-full sm:w-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
          {/* Back Button */}
          <Link to="/progress">
            <Button
              variant="outline"
              className={`mr-0 sm:mr-4 mb-2 sm:mb-0 w-full sm:w-auto transition-all duration-200 ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          
          {/* Title and Description */}
          <div className="flex-1 min-w-0">
            <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold break-words text-center sm:text-left ${
              isDarkMode 
                ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent' 
                : 'bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent'
            }`}>
              Manage Progress
            </h1>
            <p className={`text-sm sm:text-base mt-1 text-center sm:text-left ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Update process completion status
            </p>
            
            {/* Tips Section - Simplified */}
            <div className="mt-2 hidden sm:flex items-center space-x-2 text-xs text-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Processes auto-complete when sub-processes finish • Green checkmark shows completed items</span>
            </div>
            <div className="mt-2 flex sm:hidden items-center justify-center text-[11px] text-blue-400">
              <span>Auto-complete when sub-processes finish</span>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};
