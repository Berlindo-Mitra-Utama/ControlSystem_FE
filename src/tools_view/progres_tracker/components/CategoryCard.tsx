import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'
import { Checkbox } from './checkbox'
import { Progress } from './progress'
import { Plus, Edit, Trash2, Upload, FileText, Image, Download } from 'lucide-react'
import { useTheme } from '../../../contexts/ThemeContext'
import { ProcessFormModal } from './ProcessFormModal'
import { EvidenceModal } from './EvidenceModal'
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog'

interface Evidence {
  id: string
  name: string
  type: 'image' | 'file'
  url: string
  uploadedAt: string
  size?: number
}

interface Process {
  id: string
  name: string
  completed: boolean
  notes?: string
  children?: Process[]
  evidence?: Evidence[]
  toolingDetail?: any
}

interface ProgressCategory {
  id: string
  name: string
  processes: Process[]
}

interface CategoryCardProps {
  category: ProgressCategory
  partId: string
  onAddProcess: (categoryId: string) => void
  onToggleProcess: (partId: string, categoryId: string, processId: string, childId?: string) => void
  onEditProcess: (process: Process, isSubProcess: boolean, parentProcessId?: string) => void
  onAddSubProcess: (parentProcessId: string, categoryId: string) => void
  onViewEvidence: (processId: string, subProcessId: string | undefined, evidence: Evidence[], processName: string) => void
  onDeleteProcess: (processId: string, isSubProcess: boolean, parentProcessId: string | undefined, processName: string) => void
  onProgressToolingComplete: (processId: string) => void
  onProgressUpdate: (processId: string, progress: number) => void
  onDetailChange: (processId: string, details: any) => void
  calculateProcessProgress: (process: Process) => number
  getToolingOverallFromChild: (child: Process) => number
  progressToolingDetailProgress: number
  showDetailedProcesses: boolean
}

export function CategoryCard({
  category,
  partId,
  onAddProcess,
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
}: CategoryCardProps) {
  const { isDarkMode } = useTheme()
  const [processModal, setProcessModal] = useState<{
    isOpen: boolean
    type: "add" | "edit"
    isSubProcess: boolean
    process?: Process
    parentProcessId?: string
  }>({
    isOpen: false,
    type: "add",
    isSubProcess: false
  })

  const [evidenceModal, setEvidenceModal] = useState<{
    isOpen: boolean
    processId: string
    subProcessId?: string
    processName: string
    evidence: Evidence[]
    onEvidenceChange: (evidence: Evidence[]) => void
  }>({
    isOpen: false,
    processId: '',
    processName: '',
    evidence: [],
    onEvidenceChange: () => {}
  })

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    type: "process" | "subprocess"
    processId: string
    processName: string
    parentProcessId?: string
  }>({
    isOpen: false,
    type: "process",
    processId: '',
    processName: ''
  })

  // Dynamic UI colors based on theme
  const uiColors = {
    bg: {
      primary: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
      card: isDarkMode ? 'bg-gray-800' : 'bg-white',
      secondary: isDarkMode ? 'bg-gray-700' : 'bg-gray-50',
      tertiary: isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
    },
    border: {
      primary: isDarkMode ? 'border-gray-700' : 'border-gray-300',
      secondary: isDarkMode ? 'border-gray-600' : 'border-gray-200',
      tertiary: isDarkMode ? 'border-gray-500' : 'border-gray-100'
    },
    text: {
      primary: isDarkMode ? 'text-white' : 'text-gray-900',
      secondary: isDarkMode ? 'text-gray-300' : 'text-gray-700',
      tertiary: isDarkMode ? 'text-gray-400' : 'text-gray-600'
    }
  }

  const handleAddProcess = () => {
    setProcessModal({
      isOpen: true,
      type: "add",
      isSubProcess: false
    })
  }

  const handleAddSubProcess = (parentProcessId: string) => {
    setProcessModal({
      isOpen: true,
      type: "add",
      isSubProcess: true,
      parentProcessId
    })
  }

  const handleEditProcess = (process: Process, isSubProcess: boolean, parentProcessId?: string) => {
    setProcessModal({
      isOpen: true,
      type: "edit",
      isSubProcess,
      process,
      parentProcessId
    })
  }

  const handleViewEvidence = (processId: string, processName: string, subProcessId?: string, evidence: Evidence[] = []) => {
    setEvidenceModal({
      isOpen: true,
      processId,
      subProcessId,
      processName,
      evidence,
      onEvidenceChange: (newEvidence: Evidence[]) => {
        // Update evidence in the process
        console.log('Evidence updated:', newEvidence)
        // You can implement the actual update logic here
      }
    })
  }

  const handleDeleteProcess = (processId: string, isSubProcess: boolean, processName: string, parentProcessId?: string) => {
    setDeleteDialog({
      isOpen: true,
      type: isSubProcess ? "subprocess" : "process",
      processId,
      processName,
      parentProcessId
    })
  }

  const handleProcessSave = (processData: { name: string; notes?: string; completed: boolean }) => {
    if (processModal.type === "add") {
      if (processModal.isSubProcess && processModal.parentProcessId) {
        onAddSubProcess(processModal.parentProcessId, category.id)
      } else {
        onAddProcess(category.id)
      }
    } else if (processModal.type === "edit" && processModal.process) {
      onEditProcess(processModal.process, processModal.isSubProcess, processModal.parentProcessId)
    }
    setProcessModal({ ...processModal, isOpen: false })
  }

  const handleDeleteConfirm = () => {
    if (deleteDialog.type === "subprocess" && deleteDialog.parentProcessId) {
      onDeleteProcess(deleteDialog.processId, true, deleteDialog.parentProcessId, deleteDialog.processName)
    } else {
      onDeleteProcess(deleteDialog.processId, false, undefined, deleteDialog.processName)
    }
    setDeleteDialog({ ...deleteDialog, isOpen: false })
  }

  return (
    <>
      <Card className={`${uiColors.bg.card} ${uiColors.border.primary} shadow-lg`}>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className={`text-base sm:text-lg ${uiColors.text.primary}`}>{category.name}</CardTitle>
            <Button
              size="sm"
              onClick={handleAddProcess}
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white border-transparent shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Add Process</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {category.processes.map((process) => {
              const processProgress = calculateProcessProgress(process)
              const progressColors = getProgressColor(processProgress)
              
              return (
                <div key={process.id} className={`${uiColors.bg.secondary} rounded-lg p-3 sm:p-4 w-full border ${uiColors.border.tertiary} shadow-sm`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <Checkbox
                        id={`${partId}-${category.id}-${process.id}`}
                        checked={process.completed}
                        onCheckedChange={() => onToggleProcess(partId, category.id, process.id)}
                        className={uiColors.border.tertiary}
                      />
                      <label
                        htmlFor={`${partId}-${category.id}-${process.id}`}
                        className={`font-medium cursor-pointer flex-1 break-words ${uiColors.text.primary}`}
                      >
                        {process.name}
                        {process.completed && (
                          <div className="inline-block ml-2" title="Process completed">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${progressColors.color} ${progressColors.textColor} border-current`}>
                        {processProgress}%
                      </Badge>
                      {process.children && process.children.length > 0 && (
                        <Badge variant="outline" className="text-xs bg-gray-600 text-gray-300 border-gray-500">
                          {process.children.filter(child => child.completed).length}/{process.children.length} sub
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <Progress key={`${process.id}-${progressToolingDetailProgress}`} value={processProgress} className={`h-2 ${uiColors.bg.secondary}`} />
                  </div>

                  {/* Process Actions */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Button
                      size="sm"
                      onClick={() => handleEditProcess(process, false)}
                      className="bg-blue-500 hover:bg-blue-600 text-white border-transparent text-xs px-2 py-1 h-7 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleViewEvidence(process.id, process.name, undefined, process.evidence || [])}
                      className="bg-green-500 hover:bg-green-600 text-white border-transparent text-xs px-2 py-1 h-7 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Evidence ({process.evidence?.length || 0})
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAddSubProcess(process.id)}
                      className="bg-purple-500 hover:bg-purple-600 text-white border-transparent text-xs px-2 py-1 h-7 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Sub
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDeleteProcess(process.id, false, process.name, undefined)}
                      className="bg-red-500 hover:bg-red-600 text-white border-transparent text-xs px-2 py-1 h-7 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>

                  {/* Sub-Processes */}
                  {process.children && process.children.length > 0 && (
                    <div className="mt-3">
                      <Button variant="outline" size="sm" className={`w-full justify-between ${uiColors.bg.tertiary} ${uiColors.border.secondary} ${uiColors.text.secondary} hover:${uiColors.bg.secondary} cursor-default`}>
                        <span className="text-sm">Sub-Processes ({process.children.length})</span>
                      </Button>
                      <div className={`mt-2 space-y-2 ${showDetailedProcesses ? '' : 'hidden'}`}>
                        {process.children.map((child) => (
                          <div key={child.id} className={`flex flex-col p-2 ${uiColors.bg.card} rounded border ${uiColors.border.tertiary} gap-2`}>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <Checkbox
                                  id={`${partId}-${category.id}-${process.id}-${child.id}`}
                                  checked={child.name === "Progress Tooling" ? getToolingOverallFromChild(child) === 100 : child.completed}
                                  onCheckedChange={() => {
                                    if (child.name === "Progress Tooling") return;
                                    onToggleProcess(partId, category.id, process.id, child.id);
                                  }}
                                  className={uiColors.border.tertiary}
                                  disabled={child.name === "Progress Tooling"}
                                />
                                <label htmlFor={`${partId}-${category.id}-${process.id}-${child.id}`} className={`text-sm ${uiColors.text.secondary}`}>
                                  {child.name}
                                </label>
                              </div>
                              <div className="flex flex-wrap items-center gap-1 w-full sm:w-auto">
                                <Button size="sm" onClick={() => handleEditProcess(child, true, process.id)} className="bg-blue-500 hover:bg-blue-600 text-white border-transparent text-xs px-2 py-1 h-7 shadow-sm hover:shadow-md transition-all duration-200">
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                <Button size="sm" onClick={() => handleViewEvidence(process.id, child.name, child.id, child.evidence || [])} className="bg-green-500 hover:bg-green-600 text-white border-transparent text-xs px-2 py-1 h-7 shadow-sm hover:shadow-md transition-all duration-200">
                                  <Upload className="w-3 h-3 mr-1" />
                                  Evidence ({child.evidence?.length || 0})
                                </Button>
                                <Button size="sm" onClick={() => handleDeleteProcess(child.id, true, child.name, process.id)} className="bg-red-500 hover:bg-red-600 text-white border-transparent text-xs px-2 py-1 h-7 shadow-sm hover:shadow-md transition-all duration-200">
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Process Form Modal */}
      <ProcessFormModal
        isOpen={processModal.isOpen}
        onClose={() => setProcessModal({ ...processModal, isOpen: false })}
        onSave={handleProcessSave}
        process={processModal.process}
        title={
          processModal.type === "add"
            ? `Add New ${processModal.isSubProcess ? "Sub-Process" : "Process"}`
            : `Edit ${processModal.isSubProcess ? "Sub-Process" : "Process"}`
        }
        isSubProcess={processModal.isSubProcess}
      />

      {/* Evidence Modal */}
      <EvidenceModal
        isOpen={evidenceModal.isOpen}
        onClose={() => setEvidenceModal({ ...evidenceModal, isOpen: false })}
        processName={evidenceModal.processName}
        evidence={evidenceModal.evidence}
        onEvidenceChange={evidenceModal.onEvidenceChange}
        processId={evidenceModal.processId}
        subProcessId={evidenceModal.subProcessId}
        partId={partId}
        categoryId={category.id}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ ...deleteDialog, isOpen: false })}
        onConfirm={handleDeleteConfirm}
        type={deleteDialog.type}
        name={deleteDialog.processName}
      />
    </>
  )
}

// Helper function to get progress colors
function getProgressColor(progress: number) {
  if (progress >= 80) return { color: 'bg-green-500', textColor: 'text-green-100' }
  if (progress >= 60) return { color: 'bg-yellow-500', textColor: 'text-yellow-100' }
  if (progress >= 40) return { color: 'bg-orange-500', textColor: 'text-orange-100' }
  return { color: 'bg-red-500', textColor: 'text-red-100' }
}
