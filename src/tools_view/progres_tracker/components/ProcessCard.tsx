"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { Progress } from "./progress";
import { Checkbox } from "./checkbox";
import { Edit, Plus, Upload, Trash2 } from "lucide-react";
import { ProgressToolingDropdown } from "./ProgressToolingDropdown";

interface Process {
  id: string;
  name: string;
  completed: boolean;
  notes?: string;
  children?: Process[];
  evidence?: any[];
}

interface ProcessCardProps {
  process: Process;
  partId: string;
  categoryId: string;
  onToggleProcess: () => void;
  onEdit: () => void;
  onAddSub: () => void;
  onEvidence: () => void;
  onDelete: () => void;
  uiColors: any;
  getProgressColor: (progress: number) => any;
}

export function ProcessCard({ 
  process, 
  partId, 
  categoryId, 
  onToggleProcess, 
  onEdit, 
  onAddSub, 
  onEvidence, 
  onDelete, 
  uiColors, 
  getProgressColor 
}: ProcessCardProps) {
  const processProgress = process.children && process.children.length > 0
    ? Math.round((process.children.filter(child => child.completed).length / process.children.length) * 100)
    : process.completed ? 100 : 0;

  const progressColors = getProgressColor(processProgress);

  return (
    <div className={`${uiColors.bg.secondary} rounded-lg p-3 sm:p-4 w-full border ${uiColors.border.tertiary} shadow-sm`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <Checkbox
            id={`${partId}-${categoryId}-${process.id}`}
            checked={process.completed}
            onCheckedChange={onToggleProcess}
            className={uiColors.border.tertiary}
          />
          <label
            htmlFor={`${partId}-${categoryId}-${process.id}`}
            className={`font-medium cursor-pointer flex-1 break-words ${
              process.completed ? `${uiColors.text.success} line-through` : uiColors.text.primary
            }`}
          >
            {process.name}
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs ${progressColors.color} ${progressColors.textColor} border-current`}
          >
            {processProgress}%
          </Badge>
        </div>
      </div>

      {/* Navigation buttons above progress */}
      <div className="flex flex-wrap items-center gap-1 mb-3">
        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
          className={`${uiColors.text.secondary} hover:${uiColors.bg.tertiary} ${uiColors.border.secondary} ${uiColors.bg.card} text-xs px-2 py-1 h-7`}
        >
          <Edit className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onAddSub}
          className={`${uiColors.text.secondary} hover:${uiColors.bg.tertiary} ${uiColors.border.secondary} ${uiColors.bg.card} text-xs px-2 py-1 h-7`}
        >
          <Plus className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">Add Sub</span>
          <span className="sm:hidden">Sub</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onEvidence}
          className={`${uiColors.text.accent} hover:${uiColors.bg.tertiary} ${uiColors.border.accent} ${uiColors.bg.card} text-xs px-2 py-1 h-7`}
        >
          <Upload className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">Evidence ({process.evidence?.length || 0})</span>
          <span className="sm:hidden">({process.evidence?.length || 0})</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
          className={`${uiColors.text.error} hover:${uiColors.bg.tertiary} ${uiColors.border.error} ${uiColors.bg.card} text-xs px-2 py-1 h-7`}
        >
          <Trash2 className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </div>

      {/* Progress bar for this process */}
      <div className="mb-3">
        <Progress value={processProgress} className={`h-2 ${uiColors.bg.secondary}`} />
      </div>

      {/* Child Processes - Now as Collapsible Section */}
      {process.children && process.children.length > 0 && (
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Toggle sub-process visibility for this process
              const processElement = document.getElementById(`subprocess-${process.id}`)
              if (processElement) {
                processElement.classList.toggle('hidden')
              }
              // Toggle chevron rotation
              const chevron = document.getElementById(`chevron-${process.id}`)
              if (chevron) {
                chevron.classList.toggle('rotate-180')
              }
            }}
            className={`w-full justify-between ${uiColors.bg.tertiary} ${uiColors.border.secondary} ${uiColors.text.secondary} hover:${uiColors.bg.secondary}`}
          >
            <span className="text-sm">Sub-Processes ({process.children.length})</span>
            <svg
              id={`chevron-${process.id}`}
              className="w-4 h-4 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
          <div id={`subprocess-${process.id}`} className="mt-2 space-y-2 hidden">
            {process.children.map((child) => (
              <div key={child.id} className={`flex flex-col p-2 ${uiColors.bg.card} rounded border ${uiColors.border.tertiary} gap-2`}>
                {/* First row: Label and Action buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <Checkbox
                      id={`${partId}-${categoryId}-${process.id}-${child.id}`}
                      checked={child.completed}
                      onCheckedChange={() => {
                        // Handle child toggle
                      }}
                      className={uiColors.border.tertiary}
                    />
                    <label
                      htmlFor={`${partId}-${categoryId}-${process.id}-${child.id}`}
                      className={`text-sm cursor-pointer flex-1 break-words ${
                        child.completed ? `${uiColors.text.success} line-through` : uiColors.text.secondary
                      }`}
                    >
                      {child.name}
                    </label>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-1 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Handle child edit
                      }}
                      className={`${uiColors.text.secondary} hover:${uiColors.bg.tertiary} ${uiColors.border.secondary} ${uiColors.bg.card} text-xs px-2 py-1 h-7`}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Handle child evidence
                      }}
                      className={`${uiColors.text.accent} hover:${uiColors.bg.tertiary} ${uiColors.border.accent} ${uiColors.bg.card} text-xs px-2 py-1 h-7`}
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Evidence ({child.evidence?.length || 0})</span>
                      <span className="sm:hidden">({child.evidence?.length || 0})</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Handle child delete
                      }}
                      className={`${uiColors.text.error} hover:${uiColors.bg.tertiary} ${uiColors.border.error} ${uiColors.bg.card} text-xs px-2 py-1 h-7`}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
                
                {/* Second row: Progress Tooling Dropdown (only for Progress Tooling) */}
                {child.name === "Progress Tooling" && (
                  <div className="w-full mt-2">
                    <ProgressToolingDropdown progressToolingChild={child} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 