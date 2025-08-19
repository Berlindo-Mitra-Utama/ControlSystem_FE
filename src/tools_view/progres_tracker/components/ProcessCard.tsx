"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Progress } from './progress';
import { Edit, Plus, Upload, Trash2, FileText, Download, Image } from 'lucide-react';
import { getProgressColor } from '../../const/colors';
import { ProgressToolingDropdown } from './ProgressToolingDropdown';
import { useTheme } from '../../../contexts/ThemeContext';

interface ProcessCardProps {
  process: any;
  partId: string;
  categoryId: string;
  categoryName: string;
  uiColors: any;
  onToggleProcess: (partId: string, progressId: string, processId: string, childId?: string) => void;
  onEditProcess: (processData: any) => void;
  onAddSubProcess: (processData: any) => void;
  onViewEvidence: (evidenceData: any) => void;
  onDeleteProcess: (processData: any) => void;
  onProgressToolingComplete: (completed: boolean) => void;
  onProgressUpdate: (progress: number) => void;
  onDetailChange: (detail: any) => void;
  calculateProcessProgress: (process: any) => number;
  getToolingOverallFromChild: (child: any) => number;
  progressToolingDetailProgress: number;
  showDetailedProcesses: boolean;
}

export const ProcessCard: React.FC<ProcessCardProps> = ({
  process,
  partId,
  categoryId,
  categoryName,
  uiColors,
  onToggleProcess,
  onEditProcess,
  onAddSubProcess,
  onViewEvidence,
  onDeleteProcess,
  onProgressToolingComplete,
  onProgressUpdate,
  onDetailChange,
  calculateProcessProgress,
  getToolingOverallFromChild,
  progressToolingDetailProgress,
  showDetailedProcesses
}) => {
  const { isDarkMode } = useTheme();
  const processProgress = calculateProcessProgress(process);
  const progressColors = getProgressColor(processProgress);

  const handleInlineDeleteEvidence = (evidenceId: string, subProcessId?: string) => {
    // This will be handled by parent component
    console.log('Delete evidence:', evidenceId, 'from subProcess:', subProcessId);
  };

  return (
    <div className={`${uiColors.bg.secondary} rounded-lg p-3 sm:p-4 w-full border ${uiColors.border.tertiary} shadow-sm`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <Checkbox
            id={`${partId}-${categoryId}-${process.id}`}
            checked={process.completed}
            onCheckedChange={() => onToggleProcess(partId, categoryId, process.id)}
            className={uiColors.border.tertiary}
          />
          <label
            htmlFor={`${partId}-${categoryId}-${process.id}`}
            className={`font-medium cursor-pointer flex-1 break-words ${uiColors.text.primary}`}
          >
            {process.name}
            {process.completed && (
              <div className="inline-block ml-2" title="Process completed">
                <svg 
                  className="w-4 h-4 text-green-500 transform transition-all duration-300 ease-out scale-100 hover:scale-110 hover:text-green-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs ${progressColors.color} ${progressColors.textColor} border-current`}
          >
            {processProgress}%
          </Badge>
          {process.children && process.children.length > 0 && (
            <Badge
              variant="outline"
              className={`text-xs border-gray-500 ${
                isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {process.children.filter((child: any) => child.completed).length}/{process.children.length} sub
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation buttons above progress */}
      <div className="flex flex-wrap items-center gap-1 mb-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEditProcess({
            type: "edit",
            isSubProcess: false,
            partId,
            categoryId,
            processId: process.id,
            process
          })}
          className={`text-xs px-2 py-1 h-7 ${
            isDarkMode 
              ? 'text-gray-300 hover:bg-gray-700 border-gray-600 bg-gray-800' 
              : 'text-gray-700 hover:bg-gray-100 border-gray-300 bg-white'
          }`}
        >
          <Edit className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAddSubProcess({
            type: "add",
            isSubProcess: true,
            partId,
            categoryId,
            processId: process.id
          })}
          className={`text-xs px-2 py-1 h-7 ${
            isDarkMode 
              ? 'text-gray-300 hover:bg-gray-700 border-gray-600 bg-gray-800' 
              : 'text-gray-700 hover:bg-gray-100 border-gray-300 bg-white'
          }`}
        >
          <Plus className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">Add Sub</span>
          <span className="sm:hidden">Sub</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewEvidence({
            processId: process.id,
            processName: process.name,
            evidence: process.evidence || [],
            categoryId
          })}
          className={`text-xs px-2 py-1 h-7 ${
            isDarkMode 
              ? 'text-blue-400 hover:bg-gray-700 border-blue-400 bg-gray-800' 
              : 'text-blue-600 hover:bg-gray-100 border-blue-400 bg-white'
          }`}
        >
          <Upload className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">Evidence ({process.evidence?.length || 0})</span>
          <span className="sm:hidden">({process.evidence?.length || 0})</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDeleteProcess({
            type: "process",
            partId,
            categoryId,
            processId: process.id,
            name: process.name
          })}
          className={`text-xs px-2 py-1 h-7 ${
            isDarkMode 
              ? 'text-red-400 hover:bg-gray-700 border-red-400 bg-gray-800' 
              : 'text-red-600 hover:bg-gray-100 border-red-400 bg-white'
          }`}
        >
          <Trash2 className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </div>

      {/* Inline Evidence - Process level */}
      {Array.isArray(process.evidence) && process.evidence.length > 0 && (
        <div className={`mb-3 p-2 rounded-lg border ${
          isDarkMode 
            ? 'bg-gray-800/40 border-gray-700/40' 
            : 'bg-gray-100/40 border-gray-200/40'
        }`}>
          <div className={`text-xs mb-1 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>Evidence ({process.evidence.length})</div>
          <div className="flex flex-col gap-1">
            {process.evidence.map((ev: any) => (
              <div className={`rounded-md px-2 py-2 border flex items-center justify-between ${
                isDarkMode 
                  ? 'bg-gray-800/60 hover:bg-gray-800/80 border-gray-700/50' 
                  : 'bg-white/60 hover:bg-white/80 border-gray-200/50'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  {ev.type === 'image' ? (
                    <Image className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-green-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className={`text-xs truncate ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{ev.name}</div>
                    <div className={`text-[10px] ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>{new Date(ev.uploadedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {ev.url && (
                    <Button size="sm" variant="ghost" className="p-1 text-blue-400 hover:text-white" onClick={() => window.open(ev.url, '_blank')}>
                      <Download className="w-3 h-3" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="p-1 text-red-400 hover:text-white" onClick={() => handleInlineDeleteEvidence(ev.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar for this process */}
      <div className="mb-3">
        <Progress 
          value={processProgress} 
          className={`h-2 ${uiColors.bg.secondary}`} 
        />
        {process.name === "Tooling" && (
          <div className="mt-1 text-xs text-blue-400">
            Progress includes Progress Tooling detail: {progressToolingDetailProgress}%
          </div>
        )}
      </div>

      {/* Process Notes */}
      {process.notes && (
        <div className={`mb-3 p-3 rounded-lg border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/30' 
            : 'bg-gray-100/50 border-gray-200/30'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className={`text-sm font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Notes</span>
          </div>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>{process.notes}</p>
        </div>
      )}

      {/* Child Processes - Now as Collapsible Section */}
      {process.children && process.children.length > 0 && (
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            className={`w-full justify-between cursor-default ${
              isDarkMode 
                ? 'bg-gray-600 border-gray-500 text-gray-300 hover:bg-gray-700' 
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-sm">Sub-Processes ({process.children.length})</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${showDetailedProcesses ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
          <div className={`mt-2 space-y-2 ${showDetailedProcesses ? '' : 'hidden'}`}>
            {process.children.map((child: any) => (
              <div key={child.id} className={`flex flex-col p-2 rounded border gap-2 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-500' 
                  : 'bg-white border-gray-200'
              }`}>
                {/* First row: Label and Action buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <Checkbox
                      id={`${partId}-${categoryId}-${process.id}-${child.id}`}
                      checked={child.name === "Progress Tooling" ? getToolingOverallFromChild(child) === 100 : child.completed}
                      onCheckedChange={() => {
                        if (child.name === "Progress Tooling") {
                          // Progress Tooling tidak bisa di-toggle manual
                          return;
                        }
                        onToggleProcess(partId, categoryId, process.id, child.id);
                      }}
                      className={`${
                        child.name === "Progress Tooling" ? "opacity-50 cursor-not-allowed" : ""
                      } ${
                        isDarkMode ? 'border-gray-500' : 'border-gray-300'
                      }`}
                      disabled={child.name === "Progress Tooling"}
                    />
                    <label
                      htmlFor={`${partId}-${categoryId}-${process.id}-${child.id}`}
                      className={`text-sm cursor-pointer flex-1 break-words ${
                        child.name === "Progress Tooling" 
                          ? `${isDarkMode ? 'text-gray-400' : 'text-gray-500'} opacity-60 cursor-not-allowed` 
                          : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      {child.name}
                      {child.name === "Progress Tooling" && (
                        <span className="ml-2 text-xs text-blue-400 font-normal">
                          {getToolingOverallFromChild(child) === 100 ? "(Completed)" : `(Overall Progress: ${getToolingOverallFromChild(child)}%)`}
                        </span>
                      )}
                      {child.name === "Progress Tooling" && getToolingOverallFromChild(child) === 100 && (
                        <div className="inline-block ml-2" title="Sub-process completed">
                          <svg 
                            className="w-3 h-3 text-green-500 transform transition-all duration-300 ease-out scale-100 hover:scale-110 hover:text-green-400" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {child.name !== "Progress Tooling" && child.completed && (
                        <div className="inline-block ml-2" title="Sub-process completed">
                          <svg 
                            className="w-3 h-3 text-green-500 transform transition-all duration-300 ease-out scale-100 hover:scale-110 hover:text-green-400" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </label>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-1 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditProcess({
                        type: "edit",
                        isSubProcess: true,
                        partId,
                        categoryId,
                        processId: process.id,
                        subProcessId: child.id,
                        process: child
                      })}
                      className={`text-xs px-2 py-1 h-7 ${
                        isDarkMode 
                          ? 'text-gray-300 hover:bg-gray-700 border-gray-600 bg-gray-800' 
                          : 'text-gray-700 hover:bg-gray-100 border-gray-300 bg-white'
                      }`}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewEvidence({
                        processId: process.id,
                        subProcessId: child.id,
                        processName: child.name,
                        evidence: child.evidence || [],
                        categoryId
                      })}
                      className={`text-xs px-2 py-1 h-7 ${
                        isDarkMode 
                          ? 'text-blue-400 hover:bg-gray-700 border-blue-400 bg-gray-800' 
                          : 'text-blue-600 hover:bg-gray-100 border-blue-400 bg-white'
                      }`}
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Evidence ({child.evidence?.length || 0})</span>
                      <span className="sm:hidden">({child.evidence?.length || 0})</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeleteProcess({
                        type: "subprocess",
                        partId,
                        categoryId,
                        processId: process.id,
                        subProcessId: child.id,
                        name: child.name
                      })}
                      className={`text-xs px-2 py-1 h-7 ${
                        isDarkMode 
                          ? 'text-red-400 hover:bg-gray-700 border-red-400 bg-gray-800' 
                          : 'text-red-600 hover:bg-gray-100 border-red-400 bg-white'
                      }`}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
                
                {/* Inline Evidence - Sub-process level */}
                {Array.isArray(child.evidence) && child.evidence.length > 0 && (
                  <div className={`mb-2 p-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800/40 border-gray-700/40' 
                      : 'bg-gray-100/40 border-gray-200/40'
                  }`}>
                    <div className={`text-xs mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Evidence ({child.evidence.length})</div>
                    <div className="flex flex-col gap-1">
                      {child.evidence.map((ev: any) => (
                        <div className={`rounded-md px-2 py-2 border flex items-center justify-between ${
                          isDarkMode 
                            ? 'bg-gray-800/60 hover:bg-gray-800/80 border-gray-700/50' 
                            : 'bg-white/60 hover:bg-white/80 border-gray-200/50'
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            {ev.type === 'image' ? (
                              <Image className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-green-400 flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className={`text-xs truncate ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>{ev.name}</div>
                              <div className={`text-[10px] ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>{new Date(ev.uploadedAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {ev.url && (
                              <Button size="sm" variant="ghost" className="p-1 text-blue-400 hover:text-white" onClick={() => window.open(ev.url, '_blank')}>
                                <Download className="w-3 h-3" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="p-1 text-red-400 hover:text-white" onClick={() => handleInlineDeleteEvidence(ev.id, child.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Sub-process Notes */}
                {child.notes && (
                  <div className={`p-2 rounded border ${
                    isDarkMode 
                      ? 'bg-gray-800/30 border-gray-700/20' 
                      : 'bg-gray-100/30 border-gray-200/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3 h-3 text-blue-400" />
                      <span className={`text-xs font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>Notes</span>
                    </div>
                    <p className={`text-xs ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-600'
                    }`}>{child.notes}</p>
                  </div>
                )}
              
                {/* Second row: Progress Tooling Dropdown (only for Progress Tooling) */}
                {child.name === "Progress Tooling" && (
                  <div className="w-full mt-2">
                    <ProgressToolingDropdown 
                      progressToolingChild={child}
                      partId={partId}
                      categoryId={categoryId}
                      processId={child.id}
                      subProcessId={child.id}
                      onProgressToolingComplete={onProgressToolingComplete}
                      onProgressUpdate={onProgressUpdate}
                      onDetailChange={onDetailChange}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 