import React from 'react';
import { Button } from './button';
import { getUIColors } from '../../const/colors';

interface ProcessSummaryHeaderProps {
  showDetailedProcesses: boolean;
  onToggleDetailedProcesses: () => void;
  uiColors: any;
}

export const ProcessSummaryHeader: React.FC<ProcessSummaryHeaderProps> = ({
  showDetailedProcesses,
  onToggleDetailedProcesses,
  uiColors
}) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
       
        <div className="flex flex-col items-end gap-2">
          {/* View All Process Detail Toggle Button */}
          <Button
            onClick={onToggleDetailedProcesses}
            variant="outline"
            size="sm"
            className={`w-full sm:w-auto ${uiColors.button.primary.bg} hover:${uiColors.button.primary.hover} ${uiColors.button.primary.text} ${uiColors.button.primary.border}`}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="hidden sm:inline">
              {showDetailedProcesses ? "Hide Process Details" : "View All Process Detail"}
            </span>
            <span className="sm:hidden">
              {showDetailedProcesses ? "Hide" : "View All"}
            </span>
            <svg
              className={`w-4 h-4 ml-2 transition-transform duration-200 ${showDetailedProcesses ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};
