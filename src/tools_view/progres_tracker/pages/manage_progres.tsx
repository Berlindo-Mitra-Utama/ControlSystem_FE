"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/card"
import { Badge } from "../components/badge"
import { Checkbox } from "../components/checkbox"
import { Button } from "../components/button"
import { Progress } from "../components/progress"
import { Input } from "../components/input"
import { Textarea } from "../components/textarea"
import { Label } from "../components/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/alert-dialog"
import { Plus, Edit, Trash2, MoreVertical, AlertTriangle, X, Save, Upload, FileText, Image, Download } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { Colors, getProgressColor, getUIColors } from "../../const/colors"

// Types and Interfaces
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
}

interface ProgressCategory {
  id: string
  name: string
  processes: Process[]
}

interface Part {
  id: string
  partName: string
  partNumber: string
  customer: string
  progress: ProgressCategory[]
}

// Sample Data - Empty initial array, data will be loaded from localStorage
const initialParts: Part[] = []

// Utility Functions
const calculateProcessProgress = (process: Process): number => {
  if (process.children && process.children.length > 0) {
    const completedChildren = process.children.filter((child) => child.completed).length
    return Math.round((completedChildren / process.children.length) * 100)
  }
  return process.completed ? 100 : 0
}

const calculateOverallProgress = (part: Part): number => {
  let totalTasks = 0
  let completedTasks = 0

  part.progress.forEach((progress) => {
    progress.processes.forEach((process) => {
      if (process.children && process.children.length > 0) {
        process.children.forEach((child) => {
          totalTasks++
          if (child.completed) completedTasks++
        })
      } else {
        totalTasks++
        if (process.completed) completedTasks++
      }
    })
  })

  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
}

const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

// Add a new part
const addPart = (parts: Part[], partData: { partName: string; partNumber: string; customer: string }): Part[] => {
  const newPart: Part = {
    id: generateId(),
    partName: partData.partName,
    partNumber: partData.partNumber,
    customer: partData.customer,
    progress: [
      {
        id: "design",
        name: "Design",
        processes: [
          {
            id: generateId(),
            name: "Nama Part/No Part/Cust.",
            completed: false,
            children: [],
            evidence: []
          },
          {
            id: generateId(),
            name: "Drawing Part",
            completed: false,
            children: [
              {
                id: generateId(),
                name: "Comp/Assy",
                completed: false,
                evidence: []
              },
              {
                id: generateId(),
                name: "Child Part",
                completed: false,
                evidence: []
              }
            ],
            evidence: []
          },
          {
            id: generateId(),
            name: "Surat Perintah Kerja (SPK)",
            completed: false,
            children: [],
            evidence: []
          },
          {
            id: generateId(),
            name: "Master Schedule",
            completed: false,
            children: [],
            evidence: []
          },
          {
            id: generateId(),
            name: "PPAP",
            completed: false,
            children: [
              {
                id: generateId(),
                name: "Design Record",
                completed: false,
                evidence: []
              },
              {
                id: generateId(),
                name: "Engineering Change Document",
                completed: false,
                evidence: []
              },
              {
                id: generateId(),
                name: "Engineering Approval",
                completed: false,
                evidence: []
              },
              {
                id: generateId(),
                name: "Process Flow Diagram",
                completed: false,
                evidence: []
              },
              {
                id: generateId(),
                name: "FMEA",
                completed: false,
                evidence: []
              },
              {
                id: generateId(),
                name: "Control Plan",
                completed: false,
                children: [
                  {
                    id: generateId(),
                    name: "QCPC",
                    completed: false,
                    evidence: []
                  },
                  {
                    id: generateId(),
                    name: "Part Inspection Standard",
                    completed: false,
                    evidence: []
                  },
                  {
                    id: generateId(),
                    name: "Check Sheet",
                    completed: false,
                    evidence: []
                  }
                ],
                evidence: []
              },
              {
                id: generateId(),
                name: "Measurement System Analysis (MSA)",
                completed: false,
                evidence: []
              },
              {
                id: generateId(),
                name: "Dimensional Result",
                completed: false,
                children: [
                  {
                    id: generateId(),
                    name: "Check Sheet",
                    completed: false,
                    evidence: []
                  }
                ],
                evidence: []
              },
              {
                id: generateId(),
                name: "Material & Performance Test Result",
                completed: false,
                children: [
                  {
                    id: generateId(),
                    name: "Mill Sheet",
                    completed: false,
                    evidence: []
                  },
                  {
                    id: generateId(),
                    name: "Test Lain",
                    completed: false,
                    evidence: []
                  }
                ],
                evidence: []
              },
              {
                id: generateId(),
                name: "Sample Production Part",
                completed: false,
                evidence: []
              }
            ]
          }
        ],
      },
              {
          id: "manufacturing",
          name: "Manufacturing",
          processes: [
            {
              id: generateId(),
              name: "Tooling",
              completed: false,
              children: [
                {
                  id: generateId(),
                  name: "Master Schedule Tooling",
                  completed: false,
                  evidence: []
                },
                {
                  id: generateId(),
                  name: "Trial Tooling Report (TPTR)",
                  completed: false,
                  evidence: []
                },
                {
                  id: generateId(),
                  name: "Design Tooling",
                  completed: false,
                  evidence: []
                }
              ],
              evidence: []
            }
          ],
        },
              {
          id: "quality",
          name: "Quality Control",
          processes: [
            {
              id: generateId(),
              name: "Approval (Customer)",
              completed: false,
              children: [],
              evidence: []
            }
          ],
        },
    ],
  }
  return [...parts, newPart]
}

// Edit an existing part
const editPart = (parts: Part[], partId: string, partData: { partName: string; partNumber: string; customer: string }): Part[] => {
  return parts.map((part) => {
    if (part.id !== partId) return part

    return {
      ...part,
      partName: partData.partName,
      partNumber: partData.partNumber,
      customer: partData.customer,
    }
  })
}

// Delete a part
const deletePart = (parts: Part[], partId: string): Part[] => {
  return parts.filter((part) => part.id !== partId)
}

const addProcess = (parts: Part[], partId: string, categoryId: string, newProcess: Omit<Process, "id">): Part[] => {
  return parts.map((part) => {
    if (part.id !== partId) return part

    return {
      ...part,
      progress: part.progress.map((category) => {
        if (category.id !== categoryId) return category

        return {
          ...category,
          processes: [...category.processes, { ...newProcess, id: generateId() }],
        }
      }),
    }
  })
}

const editProcess = (
  parts: Part[],
  partId: string,
  categoryId: string,
  processId: string,
  updatedProcess: Partial<Process>,
): Part[] => {
  return parts.map((part) => {
    if (part.id !== partId) return part

    return {
      ...part,
      progress: part.progress.map((category) => {
        if (category.id !== categoryId) return category

        return {
          ...category,
          processes: category.processes.map((process) => {
            if (process.id !== processId) return process
            return { ...process, ...updatedProcess }
          }),
        }
      }),
    }
  })
}

const deleteProcess = (parts: Part[], partId: string, categoryId: string, processId: string): Part[] => {
  return parts.map((part) => {
    if (part.id !== partId) return part

    return {
      ...part,
      progress: part.progress.map((category) => {
        if (category.id !== categoryId) return category

        return {
          ...category,
          processes: category.processes.filter((process) => process.id !== processId),
        }
      }),
    }
  })
}

const addSubProcess = (
  parts: Part[],
  partId: string,
  categoryId: string,
  processId: string,
  newSubProcess: Omit<Process, "id">,
): Part[] => {
  return parts.map((part) => {
    if (part.id !== partId) return part

    return {
      ...part,
      progress: part.progress.map((category) => {
        if (category.id !== categoryId) return category

        return {
          ...category,
          processes: category.processes.map((process) => {
            if (process.id !== processId) return process

            return {
              ...process,
              children: [...(process.children || []), { ...newSubProcess, id: generateId() }],
            }
          }),
        }
      }),
    }
  })
}

const editSubProcess = (
  parts: Part[],
  partId: string,
  categoryId: string,
  processId: string,
  subProcessId: string,
  updatedSubProcess: Partial<Process>,
): Part[] => {
  return parts.map((part) => {
    if (part.id !== partId) return part

    return {
      ...part,
      progress: part.progress.map((category) => {
        if (category.id !== categoryId) return category

        return {
          ...category,
          processes: category.processes.map((process) => {
            if (process.id !== processId) return process

            return {
              ...process,
              children: process.children?.map((child) => {
                if (child.id !== subProcessId) return child
                return { ...child, ...updatedSubProcess }
              }),
            }
          }),
        }
      }),
    }
  })
}

const deleteSubProcess = (
  parts: Part[],
  partId: string,
  categoryId: string,
  processId: string,
  subProcessId: string,
): Part[] => {
  return parts.map((part) => {
    if (part.id !== partId) return part

    return {
      ...part,
      progress: part.progress.map((category) => {
        if (category.id !== categoryId) return category

        return {
          ...category,
          processes: category.processes.map((process) => {
            if (process.id !== processId) return process

            return {
              ...process,
              children: process.children?.filter((child) => child.id !== subProcessId),
            }
          }),
        }
      }),
    }
  })
}

// Process Form Modal Component
interface ProcessFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (processData: { name: string; notes?: string; completed: boolean }) => void
  process?: Process | null
  title: string
  isSubProcess?: boolean
}

function ProcessFormModal({ isOpen, onClose, onSave, process, title, isSubProcess = false }: ProcessFormModalProps) {
  const [name, setName] = useState(process?.name || "")
  const [notes, setNotes] = useState(process?.notes || "")
  const [completed, setCompleted] = useState(process?.completed || false)

  const handleSave = () => {
    if (!name.trim()) return

    onSave({
      name: name.trim(),
      notes: notes.trim() || undefined,
      completed,
    })

    // Reset form
    setName("")
    setNotes("")
    setCompleted(false)
    onClose()
  }

  const handleClose = () => {
    // Reset form
    setName(process?.name || "")
    setNotes(process?.notes || "")
    setCompleted(process?.completed || false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm sm:max-w-md bg-gray-800 border-gray-700 text-white mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-white">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-300">
              {isSubProcess ? "Sub-Process" : "Process"} Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${isSubProcess ? "sub-process" : "process"} name`}
              className="mt-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-300">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter notes or description"
              rows={3}
              className="mt-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="completed"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <Label htmlFor="completed" className="text-sm font-medium text-gray-300">
              Mark as completed
            </Label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
          <Button
            onClick={handleClose}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Part Form Modal Component
function PartFormModal({
  isOpen,
  onClose,
  onSave,
  part,
  title,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (partData: { partName: string; partNumber: string; customer: string }) => void
  part?: Part
  title: string
}) {
  const [partName, setPartName] = useState(part?.partName || "")
  const [partNumber, setPartNumber] = useState(part?.partNumber || "")
  const [customer, setCustomer] = useState(part?.customer || "")

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && part) {
      setPartName(part.partName)
      setPartNumber(part.partNumber)
      setCustomer(part.customer)
    } else if (isOpen) {
      setPartName("")
      setPartNumber("")
      setCustomer("")
    }
  }, [isOpen, part])

  const handleClose = () => {
    onClose()
  }

  const handleSave = () => {
    onSave({
      partName: partName.trim(),
      partNumber: partNumber.trim(),
      customer: customer.trim(),
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-sm sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-white">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="partName" className="text-sm font-medium text-gray-300">
              Part Name
            </Label>
            <Input
              id="partName"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder="Enter part name"
              className="mt-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div>
            <Label htmlFor="partNumber" className="text-sm font-medium text-gray-300">
              Part Number
            </Label>
            <Input
              id="partNumber"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              placeholder="Enter part number"
              className="mt-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div>
            <Label htmlFor="customer" className="text-sm font-medium text-gray-300">
              Customer
            </Label>
            <Input
              id="customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Enter customer name"
              className="mt-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
          <Button
            onClick={handleClose}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!partName.trim() || !partNumber.trim() || !customer.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface EvidenceModalProps {
  isOpen: boolean
  onClose: () => void
  evidence: Evidence[]
  onEvidenceChange: (evidence: Evidence[]) => void
  processName: string
}

function EvidenceModal({ isOpen, onClose, evidence, onEvidenceChange, processName }: EvidenceModalProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
  const uiColors = getUIColors("dark")

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadProgress(0)
    setUploadingFiles(Array.from(files).map(f => f.name))

    try {
      const newEvidence: Evidence[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileId = generateId()
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const newProgress = prev + (100 / files.length)
            if (newProgress >= 100) {
              clearInterval(progressInterval)
              return 100
            }
            return newProgress
          })
        }, 100)
        
        // Create a blob URL for the file
        const blobUrl = URL.createObjectURL(file)
        console.log('Created blob URL:', blobUrl, 'for file:', file.name, 'type:', file.type)
        
        const evidenceItem: Evidence = {
          id: fileId,
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: blobUrl,
          uploadedAt: new Date().toISOString(),
          size: file.size
        }
        
        newEvidence.push(evidenceItem)
        
        // Wait a bit to show progress
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      onEvidenceChange([...evidence, ...newEvidence])
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setUploadingFiles([])
    }
  }

  const handleDeleteEvidence = (evidenceId: string) => {
    const evidenceToDelete = evidence.find(e => e.id === evidenceId)
    if (evidenceToDelete) {
      // Revoke the blob URL to free memory
      URL.revokeObjectURL(evidenceToDelete.url)
      console.log('Deleted evidence:', evidenceToDelete.name)
    }
    // Immediately remove from evidence list
    const updatedEvidence = evidence.filter(e => e.id !== evidenceId)
    onEvidenceChange(updatedEvidence)
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${uiColors.bg.modal} ${uiColors.border.primary} ${uiColors.text.primary} max-w-sm sm:max-w-md lg:max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl mx-4`}>
        <DialogHeader>
          <DialogTitle className={`text-lg sm:text-xl ${uiColors.text.primary}`}>Evidence for {processName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Upload Section */}
          <div className={`border ${uiColors.border.secondary} rounded-lg p-3 sm:p-4 ${uiColors.bg.secondary}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
              <h3 className={`text-base sm:text-lg font-semibold ${uiColors.text.primary}`}>Upload Evidence</h3>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="evidence-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="evidence-upload"
                  className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg cursor-pointer transition-colors w-full sm:w-auto ${
                    uploading
                      ? `${uiColors.bg.tertiary} ${uiColors.text.tertiary} cursor-not-allowed`
                      : `${uiColors.button.primary.bg} hover:${uiColors.button.primary.hover} ${uiColors.button.primary.text}`
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm sm:text-base">{uploading ? 'Uploading...' : 'Upload Files'}</span>
                </label>
              </div>
            </div>
            
            {/* Upload Progress Bar */}
            {uploading && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs sm:text-sm ${uiColors.text.secondary}`}>
                    Uploading {uploadingFiles.length} file(s)...
                  </span>
                  <span className={`text-xs sm:text-sm font-medium ${uiColors.text.accent}`}>
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <div className={`w-full h-2 ${uiColors.bg.tertiary} rounded-full overflow-hidden`}>
                  <div 
                    className={`h-full ${uiColors.button.primary.bg} transition-all duration-300 ease-out`}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                {uploadingFiles.length > 0 && (
                  <div className="mt-2">
                    <p className={`text-xs ${uiColors.text.tertiary} mb-1`}>Files being uploaded:</p>
                    <div className="space-y-1">
                      {uploadingFiles.map((fileName, index) => (
                        <div key={index} className={`text-xs ${uiColors.text.secondary} flex items-center`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            (index + 1) * (100 / uploadingFiles.length) <= uploadProgress 
                              ? uiColors.button.success.bg 
                              : uiColors.bg.tertiary
                          }`} />
                          <span className="truncate">{fileName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <p className={`text-xs sm:text-sm ${uiColors.text.tertiary}`}>
              Supported formats: Images (JPG, PNG, GIF), Documents (PDF, DOC, DOCX, XLS, XLSX), Text files
            </p>
          </div>

          {/* Evidence List */}
          {evidence.length > 0 && (
            <div className={`border ${uiColors.border.secondary} rounded-lg p-3 sm:p-4 ${uiColors.bg.secondary}`}>
              <h3 className={`text-base sm:text-lg font-semibold ${uiColors.text.primary} mb-3 sm:mb-4`}>Uploaded Evidence ({evidence.length})</h3>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {evidence.map((item) => (
                  <div key={item.id} className={`${uiColors.bg.tertiary} rounded-lg p-3 border ${uiColors.border.secondary} shadow-sm`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        {item.type === 'image' ? (
                          <Image className={`w-6 h-6 sm:w-8 sm:h-8 ${uiColors.text.accent} flex-shrink-0`} />
                        ) : (
                          <FileText className={`w-6 h-6 sm:w-8 sm:h-8 ${uiColors.text.success} flex-shrink-0`} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs sm:text-sm font-medium ${uiColors.text.primary} truncate`}>{item.name}</p>
                          <p className={`text-xs ${uiColors.text.tertiary}`}>
                            {formatFileSize(item.size)} • {new Date(item.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(item.url, '_blank')}
                          className={`${uiColors.text.accent} hover:${uiColors.text.primary} p-1 sm:p-2`}
                        >
                          <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            // Add visual feedback
                            const button = event.currentTarget as HTMLButtonElement
                            button.classList.add('scale-95')
                            setTimeout(() => {
                              button.classList.remove('scale-95')
                            }, 150)
                            
                            handleDeleteEvidence(item.id)
                          }}
                          className={`${uiColors.text.error} hover:${uiColors.text.primary} transition-transform duration-150 p-1 sm:p-2`}
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Image Preview */}
                    {item.type === 'image' && (
                      <div className="mt-3">
                        <img
                          src={item.url}
                          alt={item.name}
                          className={`w-full h-24 sm:h-32 object-cover rounded border ${uiColors.border.secondary} transition-all duration-500 ease-in-out opacity-0`}
                          onError={(e) => {
                            console.error('Error loading image:', item.url)
                            e.currentTarget.style.display = 'none'
                          }}
                          onLoad={(e) => {
                            console.log('Image loaded successfully:', item.url)
                            // Fade in the image when loaded
                            e.currentTarget.classList.remove('opacity-0')
                            e.currentTarget.classList.add('opacity-100')
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main Manage Progress Component
export default function ManageProgres() {
  const { partId } = useParams<{ partId: string }>()
  const [parts, setParts] = useState<Part[]>(initialParts)
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [showDetailedProcesses, setShowDetailedProcesses] = useState(false)
  const uiColors = getUIColors("dark")
  const [partModal, setPartModal] = useState<{
    isOpen: boolean
    type: "add" | "edit"
    partId?: string
    part?: Part
  }>({
    isOpen: false,
    type: "add",
  })
  const [processModal, setProcessModal] = useState<{
    isOpen: boolean
    type: "add" | "edit"
    isSubProcess: boolean
    partId?: string
    categoryId?: string
    processId?: string
    subProcessId?: string
    process?: Process
  }>({
    isOpen: false,
    type: "add",
    isSubProcess: false,
  })
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    type: "process" | "subprocess" | "part"
    partId?: string
    categoryId?: string
    processId?: string
    subProcessId?: string
    name?: string
  }>({
    isOpen: false,
    type: "process"
  })

  const [evidenceModal, setEvidenceModal] = useState<{
    isOpen: boolean
    processId?: string
    subProcessId?: string
    processName: string
    evidence: Evidence[]
    onEvidenceChange: (evidence: Evidence[]) => void
  }>({
    isOpen: false,
    processName: "",
    evidence: [],
    onEvidenceChange: () => {}
  })

  // Load data from localStorage on mount
  useEffect(() => {
    console.log("ManageProgress: Starting to load data from storage")
    try {
      // Coba ambil data dari localStorage
      const savedParts = localStorage.getItem("parts-data")
      console.log("ManageProgress: Raw data from localStorage:", savedParts)
      let dataLoaded = false
      
      if (savedParts && savedParts !== "undefined" && savedParts !== "null") {
        try {
          const parsedParts = JSON.parse(savedParts)
          setParts(parsedParts)
          console.log("Data berhasil dimuat dari localStorage:", parsedParts)
          dataLoaded = true
          
          // Simpan juga ke sessionStorage sebagai backup
          sessionStorage.setItem("parts-data-backup", savedParts)
        } catch (parseError) {
          console.error("Error parsing data dari localStorage:", parseError)
          // Jika parsing localStorage gagal, coba ambil dari sessionStorage
        }
      }
      
      // Jika data dari localStorage tidak valid atau parsing gagal, coba ambil dari sessionStorage
      if (!dataLoaded) {
        const backupData = sessionStorage.getItem("parts-data-backup")
        
        if (backupData && backupData !== "undefined" && backupData !== "null") {
          try {
            const parsedBackupData = JSON.parse(backupData)
            setParts(parsedBackupData)
            console.log("Data berhasil dimuat dari sessionStorage (backup)")
            dataLoaded = true
            
            // Simpan kembali ke localStorage untuk memperbaiki data yang rusak
            localStorage.setItem("parts-data", backupData)
            
            // Notify other components
            window.dispatchEvent(new Event("parts-updated"))
          } catch (parseBackupError) {
            console.error("Error parsing data dari sessionStorage:", parseBackupError)
            // Jika parsing sessionStorage juga gagal, inisialisasi dengan array kosong
          }
        }
      }
      
      // Jika tidak ada data valid di localStorage maupun sessionStorage, inisialisasi dengan array kosong
      if (!dataLoaded) {
        console.log("Tidak ada data valid di localStorage atau sessionStorage, inisialisasi dengan array kosong")
        setParts([])
        
        // Simpan array kosong ke kedua storage
        const emptyArray = JSON.stringify([])
        localStorage.setItem("parts-data", emptyArray)
        sessionStorage.setItem("parts-data-backup", emptyArray)
        
        // Notify other components
        window.dispatchEvent(new Event("parts-updated"))
      }
    } catch (error) {
      console.error("Error memuat data dari storage:", error)
      // Jika terjadi error, inisialisasi dengan array kosong
      setParts([])
      const emptyArray = JSON.stringify([])
      localStorage.setItem("parts-data", emptyArray)
      sessionStorage.setItem("parts-data-backup", emptyArray)
    }
  }, [])

  // Find selected part based on partId from URL
  useEffect(() => {
    console.log("ManageProgress: partId from URL:", partId)
    console.log("ManageProgress: parts loaded:", parts.length)
    console.log("ManageProgress: parts data:", parts)
    
    if (partId && parts.length > 0) {
      const foundPart = parts.find(part => part.id === partId)
      console.log("ManageProgress: found part:", foundPart)
      setSelectedPart(foundPart || null)
    } else if (partId && parts.length === 0) {
      console.log("ManageProgress: partId exists but no parts loaded")
    } else if (!partId) {
      console.log("ManageProgress: no partId in URL")
    }
  }, [partId, parts])

  // Auto-save data to localStorage whenever parts change
  useEffect(() => {
    // Hanya simpan data jika parts bukan array kosong
    if (parts.length === 0) return;
    
    // Simpan data ke localStorage dan sessionStorage
    try {
      const partsData = JSON.stringify(parts)
      
      // Simpan ke localStorage dengan try-catch terpisah
      try {
        localStorage.setItem("parts-data", partsData)
        console.log("Data berhasil disimpan ke localStorage")
      } catch (localStorageError) {
        console.error("Error menyimpan ke localStorage:", localStorageError)
      }
      
      // Simpan juga ke sessionStorage dengan try-catch terpisah
      try {
        sessionStorage.setItem("parts-data-backup", partsData)
        console.log("Data berhasil disimpan ke sessionStorage sebagai backup")
      } catch (sessionStorageError) {
        console.error("Error menyimpan ke sessionStorage:", sessionStorageError)
      }
      
      // Dispatch custom event to notify other tabs/components
      window.dispatchEvent(new Event("parts-updated"))
      
      // Verifikasi data tersimpan dengan benar di localStorage
      const savedData = localStorage.getItem("parts-data")
      if (!savedData || savedData === "undefined" || savedData === "null") {
        console.error("Data tidak tersimpan dengan benar di localStorage")
        // Coba simpan ulang ke localStorage
        try {
          localStorage.setItem("parts-data", partsData)
        } catch (retryError) {
          console.error("Gagal menyimpan ulang ke localStorage:", retryError)
        }
      }
      
      // Verifikasi data tersimpan dengan benar di sessionStorage
      const backupData = sessionStorage.getItem("parts-data-backup")
      if (!backupData || backupData === "undefined" || backupData === "null") {
        console.error("Data backup tidak tersimpan dengan benar di sessionStorage")
        // Coba simpan ulang ke sessionStorage
        try {
          sessionStorage.setItem("parts-data-backup", partsData)
        } catch (retryError) {
          console.error("Gagal menyimpan ulang ke sessionStorage:", retryError)
        }
      }
      
      console.log("Data berhasil disimpan ke localStorage dan sessionStorage sebagai backup")
    } catch (error) {
      console.error("Error menyimpan data ke storage:", error)
    }
  }, [parts])

  // Toggle process completion
  const toggleProcess = (partId: string, progressId: string, processId: string, childId?: string) => {
    setParts((prevParts) => {
      const updatedParts = prevParts.map((part) => {
        if (part.id !== partId) return part

        return {
          ...part,
          progress: part.progress.map((progress) => {
            if (progress.id !== progressId) return progress

            return {
              ...progress,
              processes: progress.processes.map((process) => {
                if (process.id !== processId) return process

                if (childId && process.children) {
                  return {
                    ...process,
                    children: process.children.map((child) =>
                      child.id === childId ? { ...child, completed: !child.completed } : child,
                    ),
                  }
                } else {
                  return { ...process, completed: !process.completed }
                }
              }),
            }
          }),
        }
      })
      
      try {
        // Konversi data ke string JSON
        const partsDataString = JSON.stringify(updatedParts)
        
        // Simpan langsung ke localStorage untuk memastikan data tersimpan
        localStorage.setItem("parts-data", partsDataString)
        
        // Simpan juga ke sessionStorage sebagai backup
        sessionStorage.setItem("parts-data-backup", partsDataString)
        
        // Verifikasi data tersimpan di localStorage
        const savedData = localStorage.getItem("parts-data")
        if (!savedData || savedData === "undefined" || savedData === "null") {
          console.error("Data tidak tersimpan dengan benar di localStorage setelah toggle complete")
          // Coba simpan ulang
          localStorage.setItem("parts-data", partsDataString)
        }
        
        // Verifikasi data tersimpan di sessionStorage
        const backupData = sessionStorage.getItem("parts-data-backup")
        if (!backupData || backupData === "undefined" || backupData === "null") {
          console.error("Data tidak tersimpan dengan benar di sessionStorage setelah toggle complete")
          // Coba simpan ulang
          sessionStorage.setItem("parts-data-backup", partsDataString)
        }
        
        // Notify other components
        window.dispatchEvent(new Event("parts-updated"))
        
        console.log("Status complete berhasil diubah dan disimpan")
      } catch (error) {
        console.error("Error saat menyimpan perubahan status complete:", error)
      }
      
      return updatedParts
    })
  }

  // Handle process form save
  const handleProcessSave = (processData: { name: string; notes?: string; completed: boolean }) => {
    const { partId, categoryId, processId, subProcessId, type, isSubProcess } = processModal

    if (!partId || !categoryId) return

    try {
      let updatedParts: Part[] = [];
      
      if (isSubProcess && processId) {
        if (type === "add") {
          updatedParts = addSubProcess(parts, partId, categoryId, processId, processData);
          setParts(updatedParts);
        } else if (type === "edit" && subProcessId) {
          updatedParts = editSubProcess(parts, partId, categoryId, processId, subProcessId, processData);
          setParts(updatedParts);
        }
      } else {
        if (type === "add") {
          updatedParts = addProcess(parts, partId, categoryId, processData);
          setParts(updatedParts);
        } else if (type === "edit" && processId) {
          updatedParts = editProcess(parts, partId, categoryId, processId, processData);
          setParts(updatedParts);
        }
      }
      
      // Konversi data ke string JSON
      const partsDataString = JSON.stringify(updatedParts);
      
      // Simpan langsung ke localStorage untuk memastikan data tersimpan
      try {
        localStorage.setItem("parts-data", partsDataString);
        console.log("Data process berhasil disimpan ke localStorage");
      } catch (localStorageError) {
        console.error("Error menyimpan process ke localStorage:", localStorageError);
      }
      
      // Simpan juga ke sessionStorage sebagai backup
      try {
        sessionStorage.setItem("parts-data-backup", partsDataString);
        console.log("Data process berhasil disimpan ke sessionStorage sebagai backup");
      } catch (sessionStorageError) {
        console.error("Error menyimpan process ke sessionStorage:", sessionStorageError);
      }
      
      // Verifikasi data tersimpan di localStorage
      let savedData;
      try {
        savedData = localStorage.getItem("parts-data");
      } catch (getError) {
        console.error("Error mengakses localStorage untuk verifikasi:", getError);
        savedData = null;
      }
      
      if (!savedData || savedData === "undefined" || savedData === "null") {
        console.error("Data process tidak tersimpan dengan benar di localStorage setelah save");
        // Coba simpan ulang
        try {
          localStorage.setItem("parts-data", partsDataString);
        } catch (retryError) {
          console.error("Gagal menyimpan ulang process ke localStorage:", retryError);
        }
      }
      
      // Verifikasi data tersimpan di sessionStorage
      let backupData;
      try {
        backupData = sessionStorage.getItem("parts-data-backup");
      } catch (getError) {
        console.error("Error mengakses sessionStorage untuk verifikasi:", getError);
        backupData = null;
      }
      
      if (!backupData || backupData === "undefined" || backupData === "null") {
        console.error("Data process tidak tersimpan dengan benar di sessionStorage setelah save");
        // Coba simpan ulang
        try {
          sessionStorage.setItem("parts-data-backup", partsDataString);
        } catch (retryError) {
          console.error("Gagal menyimpan ulang process ke sessionStorage:", retryError);
        }
      }
      
      // Notify other components
      window.dispatchEvent(new Event("parts-updated"));
      
      console.log("Data process berhasil disimpan:", updatedParts);
    } catch (error) {
      console.error("Error saat menyimpan process:", error);
    }
  }

  // Handle part form save
  const handlePartSave = (partData: { partName: string; partNumber: string; customer: string }) => {
    const { partId, type } = partModal

    try {
      let updatedParts: Part[] = [];
      
      if (type === "add") {
        updatedParts = addPart(parts, partData);
        setParts(updatedParts);
      } else if (type === "edit" && partId) {
        updatedParts = editPart(parts, partId, partData);
        setParts(updatedParts);
      }
      
      // Konversi data ke string JSON
      const partsDataString = JSON.stringify(updatedParts);
      
      // Simpan langsung ke localStorage untuk memastikan data tersimpan
      try {
        localStorage.setItem("parts-data", partsDataString);
        console.log("Data part berhasil disimpan ke localStorage");
      } catch (localStorageError) {
        console.error("Error menyimpan part ke localStorage:", localStorageError);
      }
      
      // Simpan juga ke sessionStorage sebagai backup
      try {
        sessionStorage.setItem("parts-data-backup", partsDataString);
        console.log("Data part berhasil disimpan ke sessionStorage sebagai backup");
      } catch (sessionStorageError) {
        console.error("Error menyimpan part ke sessionStorage:", sessionStorageError);
      }
      
      // Verifikasi data tersimpan di localStorage
      let savedData;
      try {
        savedData = localStorage.getItem("parts-data");
      } catch (getError) {
        console.error("Error mengakses localStorage untuk verifikasi:", getError);
        savedData = null;
      }
      
      if (!savedData || savedData === "undefined" || savedData === "null") {
        console.error("Data part tidak tersimpan dengan benar di localStorage setelah save");
        // Coba simpan ulang
        try {
          localStorage.setItem("parts-data", partsDataString);
        } catch (retryError) {
          console.error("Gagal menyimpan ulang part ke localStorage:", retryError);
        }
      }
      
      // Verifikasi data tersimpan di sessionStorage
      let backupData;
      try {
        backupData = sessionStorage.getItem("parts-data-backup");
      } catch (getError) {
        console.error("Error mengakses sessionStorage untuk verifikasi:", getError);
        backupData = null;
      }
      
      if (!backupData || backupData === "undefined" || backupData === "null") {
        console.error("Data part tidak tersimpan dengan benar di sessionStorage setelah save");
        // Coba simpan ulang
        try {
          sessionStorage.setItem("parts-data-backup", partsDataString);
        } catch (retryError) {
          console.error("Gagal menyimpan ulang part ke sessionStorage:", retryError);
        }
      }
      
      // Notify other components
      window.dispatchEvent(new Event("parts-updated"));
      
      console.log("Data part berhasil disimpan:", updatedParts);
    } catch (error) {
      console.error("Error saat menyimpan part:", error);
    }
  }

  // Handle delete confirmation
  const handleDelete = () => {
    const { type, partId, categoryId, processId, subProcessId } = deleteDialog

    try {
      let updatedParts: Part[]
      let partsDataString: string

      if (type === "part" && partId) {
        updatedParts = deletePart(parts, partId)
        partsDataString = JSON.stringify(updatedParts)
        setParts(updatedParts)
        setSelectedPart(null)
      } else if (type === "process" && partId && categoryId && processId) {
        updatedParts = deleteProcess(parts, partId, categoryId, processId)
        partsDataString = JSON.stringify(updatedParts)
        setParts(updatedParts)
        setSelectedPart(updatedParts.find(p => p.id === partId) || null)
      } else if (type === "subprocess" && partId && categoryId && processId && subProcessId) {
        updatedParts = deleteSubProcess(parts, partId, categoryId, processId, subProcessId)
        partsDataString = JSON.stringify(updatedParts)
        setParts(updatedParts)
        setSelectedPart(updatedParts.find(p => p.id === partId) || null)
      } else {
        console.error("Missing required parameters for deletion")
        return
      }

      // Simpan data ke localStorage dengan try-catch terpisah
      try {
        localStorage.setItem("parts-data", partsDataString)
        console.log("Data berhasil disimpan ke localStorage setelah delete")
      } catch (localStorageError) {
        console.error("Error menyimpan ke localStorage setelah delete:", localStorageError)
      }
      
      // Simpan juga ke sessionStorage dengan try-catch terpisah
      try {
        sessionStorage.setItem("parts-data-backup", partsDataString)
        console.log("Data berhasil disimpan ke sessionStorage sebagai backup setelah delete")
      } catch (sessionStorageError) {
        console.error("Error menyimpan ke sessionStorage setelah delete:", sessionStorageError)
      }
      
      // Verifikasi data tersimpan di localStorage
      let savedData;
      try {
        savedData = localStorage.getItem("parts-data");
      } catch (getError) {
        console.error("Error mengakses localStorage untuk verifikasi setelah delete:", getError);
        savedData = null;
      }
      
      if (!savedData || savedData === "undefined" || savedData === "null") {
        console.error("Data tidak tersimpan dengan benar di localStorage setelah delete")
        // Coba simpan ulang
        try {
          localStorage.setItem("parts-data", partsDataString);
        } catch (retryError) {
          console.error("Gagal menyimpan ulang data ke localStorage setelah delete:", retryError);
        }
      }
      
      // Verifikasi data tersimpan di sessionStorage
      let backupData;
      try {
        backupData = sessionStorage.getItem("parts-data-backup");
      } catch (getError) {
        console.error("Error mengakses sessionStorage untuk verifikasi setelah delete:", getError);
        backupData = null;
      }
      
      if (!backupData || backupData === "undefined" || backupData === "null") {
        console.error("Data tidak tersimpan dengan benar di sessionStorage setelah delete")
        // Coba simpan ulang
        try {
          sessionStorage.setItem("parts-data-backup", partsDataString);
        } catch (retryError) {
          console.error("Gagal menyimpan ulang data ke sessionStorage setelah delete:", retryError);
        }
      }
      
      // Notify other components
      window.dispatchEvent(new Event("parts-updated"));
    } catch (error) {
      console.error("Error saat menghapus data:", error);
    }

    // Close the dialog but preserve the type
    setDeleteDialog({
      isOpen: false,
      type,
      partId: undefined,
      categoryId: undefined,
      processId: undefined,
      subProcessId: undefined,
      name: undefined
    })
  }

  const handleEvidenceUpdate = (partId: string, categoryId: string, processId: string, subProcessId: string | null, evidence: Evidence[]) => {
    try {
      let updatedParts: Part[]
      
      if (subProcessId) {
        // Update sub-process evidence
        updatedParts = parts.map(part => {
          if (part.id === partId) {
            return {
              ...part,
              progress: part.progress.map(category => {
                if (category.id === categoryId) {
                  return {
                    ...category,
                    processes: category.processes.map(process => {
                      if (process.id === processId) {
                        return {
                          ...process,
                          children: process.children?.map(child => {
                            if (child.id === subProcessId) {
                              return { ...child, evidence }
                            }
                            return child
                          })
                        }
                      }
                      return process
                    })
                  }
                }
                return category
              })
            }
          }
          return part
        })
      } else {
        // Update process evidence
        updatedParts = parts.map(part => {
          if (part.id === partId) {
            return {
              ...part,
              progress: part.progress.map(category => {
                if (category.id === categoryId) {
                  return {
                    ...category,
                    processes: category.processes.map(process => {
                      if (process.id === processId) {
                        return { ...process, evidence }
                      }
                      return process
                    })
                  }
                }
                return category
              })
            }
          }
          return part
        })
      }

      const partsDataString = JSON.stringify(updatedParts)
      setParts(updatedParts)
      setSelectedPart(updatedParts.find(p => p.id === partId) || null)

      // Save to localStorage and sessionStorage
      try {
        localStorage.setItem("parts-data", partsDataString)
        sessionStorage.setItem("parts-data-backup", partsDataString)
        console.log("Evidence updated and saved successfully")
      } catch (error) {
        console.error("Error saving evidence update:", error)
      }

      // Notify other components
      window.dispatchEvent(new Event("parts-updated"))
    } catch (error) {
      console.error("Error updating evidence:", error)
    }
  }

  return (  
    <div className={`min-h-screen ${uiColors.bg.primary} ${uiColors.text.primary} p-3 sm:p-4 md:p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
              <Link to="/progress">
                <Button
                  variant="outline"
                  className={`mr-0 sm:mr-4 mb-3 sm:mb-0 w-full sm:w-auto ${uiColors.border.secondary} ${uiColors.text.secondary} hover:${uiColors.bg.secondary} bg-transparent`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><path d="m15 18-6-6 6-6"/></svg>
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${uiColors.text.primary} break-words`}>Manage Progress</h1>
                <p className={`${uiColors.text.tertiary} text-sm sm:text-base mt-1`}>Update process completion status for all parts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Parts List */}
        <div className="space-y-6 sm:space-y-8">
          {selectedPart ? (
            <Card key={selectedPart.id} className={`${uiColors.bg.card} ${uiColors.border.primary} shadow-lg`}>
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className={`text-lg sm:text-xl md:text-2xl ${uiColors.text.primary} mb-2 sm:mb-3 break-words`}>{selectedPart.partName}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={`${uiColors.bg.secondary} ${uiColors.text.secondary} ${uiColors.border.secondary} text-xs sm:text-sm`}>
                        {selectedPart.partNumber}
                      </Badge>
                      <Badge variant="outline" className={`${uiColors.bg.secondary} ${uiColors.text.secondary} ${uiColors.border.secondary} text-xs sm:text-sm`}>
                        {selectedPart.customer}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
                    <div className="text-center sm:text-right order-2 sm:order-1">
                      <div className={`text-2xl sm:text-3xl md:text-4xl font-bold ${uiColors.text.primary}`}>{calculateOverallProgress(selectedPart)}%</div>
                      <div className={`text-xs sm:text-sm ${uiColors.text.tertiary}`}>Overall Progress</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 order-1 sm:order-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPartModal({
                            isOpen: true,
                            type: "edit",
                            partId: selectedPart.id,
                            part: selectedPart,
                          })
                        }
                        className={`${uiColors.text.secondary} hover:${uiColors.bg.secondary} ${uiColors.border.secondary} ${uiColors.bg.tertiary} text-xs px-2 py-1 h-7 sm:h-8`}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Edit Part</span>
                        <span className="sm:hidden">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setDeleteDialog({
                            isOpen: true,
                            type: "part",
                            partId: selectedPart.id,
                            name: selectedPart.partName,
                          })
                        }
                        className={`${uiColors.text.error} hover:${uiColors.bg.secondary} ${uiColors.border.error} ${uiColors.bg.tertiary} text-xs px-2 py-1 h-7 sm:h-8`}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Delete Part</span>
                        <span className="sm:hidden">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={calculateOverallProgress(selectedPart)} className={`h-2 sm:h-3 ${uiColors.bg.secondary}`} />
                </div>
              </CardHeader>

              <CardContent>
                {/* Overall Progress Summary with Toggle Button */}
                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                    <h3 className={`text-base sm:text-lg font-semibold ${uiColors.text.primary}`}>Process Summary</h3>
                    <Button
                      onClick={() => setShowDetailedProcesses(!showDetailedProcesses)}
                      variant="outline"
                      size="sm"
                      className={`w-full sm:w-auto ${uiColors.button.primary.bg} hover:${uiColors.button.primary.hover} ${uiColors.button.primary.text} ${uiColors.button.primary.border}`}
                    >
                      <span className="hidden sm:inline">{showDetailedProcesses ? "Hide Detailed Processes" : "View All Processes"}</span>
                      <span className="sm:hidden">{showDetailedProcesses ? "Hide Details" : "View Details"}</span>
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

                {/* Category Cards with Process Dropdowns - Only shown when showDetailedProcesses is true */}
                {showDetailedProcesses && (
                  <div className="space-y-4 sm:space-y-6">
                    {selectedPart.progress.map((progressCategory) => (
                    <Card key={progressCategory.id} className={`${uiColors.bg.tertiary} ${uiColors.border.secondary} shadow-md`}>
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <CardTitle className={`text-base sm:text-lg ${uiColors.text.primary}`}>{progressCategory.name}</CardTitle>
                          <Button
                            size="sm"
                            onClick={() =>
                              setProcessModal({
                                isOpen: true,
                                type: "add",
                                isSubProcess: false,
                                partId: selectedPart.id,
                                categoryId: progressCategory.id,
                              })
                            }
                            className={`w-full sm:w-auto ${uiColors.button.primary.bg} hover:${uiColors.button.primary.hover} ${uiColors.button.primary.text}`}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Add Process</span>
                            <span className="sm:hidden">Add</span>
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-3 sm:space-y-4">
                          {progressCategory.processes.map((process) => {
                            const processProgress = calculateProcessProgress(process)
                            const progressColors = getProgressColor(processProgress)
                            return (
                              <div key={process.id} className={`${uiColors.bg.secondary} rounded-lg p-3 sm:p-4 w-full border ${uiColors.border.tertiary} shadow-sm`}>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    <Checkbox
                                      id={`${selectedPart.id}-${progressCategory.id}-${process.id}`}
                                      checked={process.completed}
                                      onCheckedChange={() => toggleProcess(selectedPart.id, progressCategory.id, process.id)}
                                      className={uiColors.border.tertiary}
                                    />
                                    <label
                                      htmlFor={`${selectedPart.id}-${progressCategory.id}-${process.id}`}
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
                                    onClick={() =>
                                      setProcessModal({
                                        isOpen: true,
                                        type: "edit",
                                        isSubProcess: false,
                                        partId: selectedPart.id,
                                        categoryId: progressCategory.id,
                                        processId: process.id,
                                        process,
                                      })
                                    }
                                    className={`${uiColors.text.secondary} hover:${uiColors.bg.tertiary} ${uiColors.border.secondary} ${uiColors.bg.card} text-xs px-2 py-1 h-7`}
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">Edit</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setProcessModal({
                                        isOpen: true,
                                        type: "add",
                                        isSubProcess: true,
                                        partId: selectedPart.id,
                                        categoryId: progressCategory.id,
                                        processId: process.id,
                                      })
                                    }
                                    className={`${uiColors.text.secondary} hover:${uiColors.bg.tertiary} ${uiColors.border.secondary} ${uiColors.bg.card} text-xs px-2 py-1 h-7`}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">Add Sub</span>
                                    <span className="sm:hidden">Sub</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setEvidenceModal({
                                        isOpen: true,
                                        processId: process.id,
                                        processName: process.name,
                                        evidence: process.evidence || [],
                                        onEvidenceChange: (evidence) =>
                                          handleEvidenceUpdate(selectedPart.id, progressCategory.id, process.id, null, evidence)
                                      })
                                    }
                                    className={`${uiColors.text.accent} hover:${uiColors.bg.tertiary} ${uiColors.border.accent} ${uiColors.bg.card} text-xs px-2 py-1 h-7`}
                                  >
                                    <Upload className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">Evidence ({process.evidence?.length || 0})</span>
                                    <span className="sm:hidden">({process.evidence?.length || 0})</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setDeleteDialog({
                                        isOpen: true,
                                        type: "process",
                                        partId: selectedPart.id,
                                        categoryId: progressCategory.id,
                                        processId: process.id,
                                        name: process.name,
                                      })
                                    }
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
                                        <div key={child.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 ${uiColors.bg.card} rounded border ${uiColors.border.tertiary} gap-2`}>
                                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                                            <Checkbox
                                              id={`${selectedPart.id}-${progressCategory.id}-${process.id}-${child.id}`}
                                              checked={child.completed}
                                              onCheckedChange={() =>
                                                toggleProcess(selectedPart.id, progressCategory.id, process.id, child.id)
                                              }
                                              className={uiColors.border.tertiary}
                                            />
                                            <label
                                              htmlFor={`${selectedPart.id}-${progressCategory.id}-${process.id}-${child.id}`}
                                              className={`text-sm cursor-pointer flex-1 break-words ${
                                                child.completed ? `${uiColors.text.success} line-through` : uiColors.text.secondary
                                              }`}
                                            >
                                              {child.name}
                                            </label>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-1 w-full sm:w-auto">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                setProcessModal({
                                                  isOpen: true,
                                                  type: "edit",
                                                  isSubProcess: true,
                                                  partId: selectedPart.id,
                                                  categoryId: progressCategory.id,
                                                  processId: process.id,
                                                  subProcessId: child.id,
                                                  process: child,
                                                })
                                              }
                                              className={`${uiColors.text.secondary} hover:${uiColors.bg.tertiary} ${uiColors.border.secondary} ${uiColors.bg.card} text-xs px-2 py-1 h-7`}
                                            >
                                              <Edit className="w-3 h-3 mr-1" />
                                              <span className="hidden sm:inline">Edit</span>
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                setEvidenceModal({
                                                  isOpen: true,
                                                  processId: process.id,
                                                  subProcessId: child.id,
                                                  processName: child.name,
                                                  evidence: child.evidence || [],
                                                  onEvidenceChange: (evidence) =>
                                                    handleEvidenceUpdate(selectedPart.id, progressCategory.id, process.id, child.id, evidence)
                                                })
                                              }
                                              className={`${uiColors.text.accent} hover:${uiColors.bg.tertiary} ${uiColors.border.accent} ${uiColors.bg.card} text-xs px-2 py-1 h-7`}
                                            >
                                              <Upload className="w-3 h-3 mr-1" />
                                              <span className="hidden sm:inline">Evidence ({child.evidence?.length || 0})</span>
                                              <span className="sm:hidden">({child.evidence?.length || 0})</span>
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                setDeleteDialog({
                                                  isOpen: true,
                                                  type: "subprocess",
                                                  partId: selectedPart.id,
                                                  categoryId: progressCategory.id,
                                                  processId: process.id,
                                                  subProcessId: child.id,
                                                  name: child.name,
                                                })
                                              }
                                              className={`${uiColors.text.error} hover:${uiColors.bg.tertiary} ${uiColors.border.error} ${uiColors.bg.card} text-xs px-2 py-1 h-7`}
                                            >
                                              <Trash2 className="w-3 h-3 mr-1" />
                                              <span className="hidden sm:inline">Delete</span>
                                            </Button>
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
                  ))}
                </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">Part Not Found</h3>
              <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6 px-4">The part you're looking for doesn't exist or has been removed.</p>
              <Link to="/progress">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Back to Dashboard</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Part Form Modal */}
      <PartFormModal
        isOpen={partModal.isOpen}
        onClose={() => setPartModal({ ...partModal, isOpen: false })}
        onSave={handlePartSave}
        part={partModal.part}
        title={partModal.type === "add" ? "Add New Part" : "Edit Part"}
      />

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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            // When dialog is closed by clicking outside or pressing escape, preserve the type
            setDeleteDialog({
              isOpen: false,
              type: deleteDialog.type,
              partId: undefined,
              categoryId: undefined,
              processId: undefined,
              subProcessId: undefined,
              name: undefined
            })
          }
        }}
      >
        <AlertDialogContent className="bg-gray-800 border-gray-700 text-white max-w-sm sm:max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400 text-base sm:text-lg">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300 text-sm sm:text-base">
              Are you sure you want to delete the 
              {deleteDialog.type === "subprocess" ? "sub-process" : deleteDialog.type === "part" ? "part" : "process"} "
              {deleteDialog.name}"?
              {deleteDialog.type === "process" && " This will also delete all its sub-processes."}
              {deleteDialog.type === "part" && " This will also delete all its processes and sub-processes."}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700 w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
