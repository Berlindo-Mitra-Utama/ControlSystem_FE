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
import { Save, RotateCcw, Plus, Edit, Trash2, MoreVertical, AlertTriangle, X } from "lucide-react"
import { Link } from "react-router-dom"
// Types and Interfaces
interface Process {
  id: string
  name: string
  completed: boolean
  notes?: string
  children?: Process[]
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
        processes: [],
      },
      {
        id: "manufacturing",
        name: "Manufacturing",
        processes: [],
      },
      {
        id: "quality",
        name: "Quality Control",
        processes: [],
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
      <DialogContent className="max-w-md bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">{title}</DialogTitle>
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

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            onClick={handleClose}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">{title}</DialogTitle>
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

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            onClick={handleClose}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!partName.trim() || !partNumber.trim() || !customer.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main Manage Progress Component
export default function ManageProgres() {
  const [parts, setParts] = useState<Part[]>(initialParts)
  const [hasChanges, setHasChanges] = useState(false)
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

  // Load data from localStorage on mount
  useEffect(() => {
    const savedParts = localStorage.getItem("parts-data")
    if (savedParts) {
      setParts(JSON.parse(savedParts))
    } else {
      // If no data exists, create a sample part to get started
      const samplePart: Part = {
        id: generateId(),
        partName: "Sample Part",
        partNumber: "SP-001",
        customer: "Demo Customer",
        progress: [
          {
            id: "design",
            name: "Design",
            processes: [],
          },
          {
            id: "manufacturing",
            name: "Manufacturing",
            processes: [],
          },
          {
            id: "quality",
            name: "Quality Control",
            processes: [],
          },
        ],
      }
      setParts([samplePart])
      // Save to localStorage
      localStorage.setItem("parts-data", JSON.stringify([samplePart]))
      // Notify other components
      window.dispatchEvent(new Event("parts-updated"))
    }
  }, [])

  // Save data to localStorage
  const saveData = () => {
    localStorage.setItem("parts-data", JSON.stringify(parts))
    setHasChanges(false)
    // Dispatch custom event to notify other tabs/components
    window.dispatchEvent(new Event("parts-updated"))
  }

  // Reset data to initial state
  const resetData = () => {
    setParts(initialParts)
    localStorage.removeItem("parts-data")
    setHasChanges(true)
  }

  // Toggle process completion
  const toggleProcess = (partId: string, progressId: string, processId: string, childId?: string) => {
    setParts((prevParts) =>
      prevParts.map((part) => {
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
      }),
    )
    setHasChanges(true)
  }

  // Handle process form save
  const handleProcessSave = (processData: { name: string; notes?: string; completed: boolean }) => {
    const { partId, categoryId, processId, subProcessId, type, isSubProcess } = processModal

    if (!partId || !categoryId) return

    if (isSubProcess && processId) {
      if (type === "add") {
        setParts(addSubProcess(parts, partId, categoryId, processId, processData))
      } else if (type === "edit" && subProcessId) {
        setParts(editSubProcess(parts, partId, categoryId, processId, subProcessId, processData))
      }
    } else {
      if (type === "add") {
        setParts(addProcess(parts, partId, categoryId, processData))
      } else if (type === "edit" && processId) {
        setParts(editProcess(parts, partId, categoryId, processId, processData))
      }
    }

    setHasChanges(true)
  }

  // Handle part form save
  const handlePartSave = (partData: { partName: string; partNumber: string; customer: string }) => {
    const { partId, type } = partModal

    if (type === "add") {
      setParts(addPart(parts, partData))
    } else if (type === "edit" && partId) {
      setParts(editPart(parts, partId, partData))
    }

    setHasChanges(true)
  }

  // Handle delete confirmation
  const handleDelete = () => {
    const { partId, categoryId, processId, subProcessId, type } = deleteDialog

    if (type === "part" && partId) {
      setParts(deletePart(parts, partId))
    } else if (type === "subprocess" && partId && categoryId && processId && subProcessId) {
      setParts(deleteSubProcess(parts, partId, categoryId, processId, subProcessId))
    } else if (type === "process" && partId && categoryId && processId) {
      setParts(deleteProcess(parts, partId, categoryId, processId))
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <div className="flex items-center mb-2">
              <Link to="/progress">
                <Button
                  variant="outline"
                  className="mr-4 border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><path d="m15 18-6-6 6-6"/></svg>
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-4xl font-bold text-white">Manage Progress</h1>
            </div>
            <p className="text-gray-400">Update process completion status for all parts</p>
          </div>
          <div className="flex space-x-4">
            <Button
              onClick={() => setPartModal({ isOpen: true, type: "add" })}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Part
            </Button>
            <Button
              onClick={resetData}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset All
            </Button>
            <Button
              onClick={saveData}
              disabled={!hasChanges}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Changes Indicator */}
        {hasChanges && (
          <div className="mb-6 p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
            <p className="text-yellow-200">You have unsaved changes. Click "Save Changes" to persist your updates.</p>
          </div>
        )}

        {/* Parts List */}
        <div className="space-y-8">
          {parts.map((part) => {
            const overallProgress = calculateOverallProgress(part)
            return (
              <Card key={part.id} className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-white mb-2">{part.partName}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-gray-700 text-gray-300 border-gray-600">
                          {part.partNumber}
                        </Badge>
                        <Badge variant="outline" className="bg-gray-700 text-gray-300 border-gray-600">
                          {part.customer}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white">{overallProgress}%</div>
                        <div className="text-sm text-gray-400">Overall Progress</div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-800 border-gray-700">
                          <DropdownMenuItem
                            onClick={() =>
                              setPartModal({
                                isOpen: true,
                                type: "edit",
                                partId: part.id,
                                part,
                              })
                            }
                            className="text-gray-300 hover:bg-gray-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Part
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setDeleteDialog({
                                isOpen: true,
                                type: "part",
                                partId: part.id,
                                name: part.partName,
                              })
                            }
                            className="text-red-400 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Part
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress value={overallProgress} className="h-3 bg-gray-700" />
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {part.progress.map((progressCategory) => (
                      <Card key={progressCategory.id} className="bg-gray-700 border-gray-600">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg text-white">{progressCategory.name}</CardTitle>
                            <Button
                              size="sm"
                              onClick={() =>
                                setProcessModal({
                                  isOpen: true,
                                  type: "add",
                                  isSubProcess: false,
                                  partId: part.id,
                                  categoryId: progressCategory.id,
                                })
                              }
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Process
                            </Button>
                          </div>
                        </CardHeader>

                        <CardContent>
                          <div className="space-y-4">
                            {progressCategory.processes.map((process) => {
                              const processProgress = calculateProcessProgress(process)
                              return (
                                <div key={process.id} className="bg-gray-600 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2 flex-1">
                                      <Checkbox
                                        id={`${part.id}-${progressCategory.id}-${process.id}`}
                                        checked={process.completed}
                                        onCheckedChange={() => toggleProcess(part.id, progressCategory.id, process.id)}
                                        className="border-gray-400"
                                      />
                                      <label
                                        htmlFor={`${part.id}-${progressCategory.id}-${process.id}`}
                                        className={`font-medium cursor-pointer flex-1 ${
                                          process.completed ? "text-green-400 line-through" : "text-gray-200"
                                        }`}
                                      >
                                        {process.name}
                                      </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${
                                          processProgress === 100
                                            ? "bg-green-500 text-white border-green-500"
                                            : processProgress > 0
                                              ? "bg-blue-500 text-white border-blue-500"
                                              : "bg-gray-500 text-gray-300 border-gray-500"
                                        }`}
                                      >
                                        {processProgress}%
                                      </Badge>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                                          >
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-gray-800 border-gray-700">
                                          <DropdownMenuItem
                                            onClick={() =>
                                              setProcessModal({
                                                isOpen: true,
                                                type: "edit",
                                                isSubProcess: false,
                                                partId: part.id,
                                                categoryId: progressCategory.id,
                                                processId: process.id,
                                                process,
                                              })
                                            }
                                            className="text-gray-300 hover:bg-gray-700"
                                          >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit Process
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              setProcessModal({
                                                isOpen: true,
                                                type: "add",
                                                isSubProcess: true,
                                                partId: part.id,
                                                categoryId: progressCategory.id,
                                                processId: process.id,
                                              })
                                            }
                                            className="text-gray-300 hover:bg-gray-700"
                                          >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Sub-Process
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              setDeleteDialog({
                                                isOpen: true,
                                                type: "process",
                                                partId: part.id,
                                                categoryId: progressCategory.id,
                                                processId: process.id,
                                                name: process.name,
                                              })
                                            }
                                            className="text-red-400 hover:bg-red-900/20"
                                          >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Process
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>

                                  {/* Progress bar for this process */}
                                  <div className="mb-3">
                                    <Progress value={processProgress} className="h-2 bg-gray-500" />
                                  </div>

                                  {/* Child Processes */}
                                  {process.children && process.children.length > 0 && (
                                    <div className="ml-4 space-y-2 border-l-2 border-gray-500 pl-4">
                                      {process.children.map((child) => (
                                        <div key={child.id} className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2 flex-1">
                                            <Checkbox
                                              id={`${part.id}-${progressCategory.id}-${process.id}-${child.id}`}
                                              checked={child.completed}
                                              onCheckedChange={() =>
                                                toggleProcess(part.id, progressCategory.id, process.id, child.id)
                                              }
                                              className="border-gray-400"
                                            />
                                            <label
                                              htmlFor={`${part.id}-${progressCategory.id}-${process.id}-${child.id}`}
                                              className={`text-sm cursor-pointer flex-1 ${
                                                child.completed ? "text-green-400 line-through" : "text-gray-300"
                                              }`}
                                            >
                                              {child.name}
                                            </label>
                                          </div>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                              >
                                                <MoreVertical className="h-3 w-3" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-gray-800 border-gray-700">
                                              <DropdownMenuItem
                                                onClick={() =>
                                                  setProcessModal({
                                                    isOpen: true,
                                                    type: "edit",
                                                    isSubProcess: true,
                                                    partId: part.id,
                                                    categoryId: progressCategory.id,
                                                    processId: process.id,
                                                    subProcessId: child.id,
                                                    process: child,
                                                  })
                                                }
                                                className="text-gray-300 hover:bg-gray-700"
                                              >
                                                <Edit className="w-3 h-3 mr-2" />
                                                Edit
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() =>
                                                  setDeleteDialog({
                                                    isOpen: true,
                                                    type: "subprocess",
                                                    partId: part.id,
                                                    categoryId: progressCategory.id,
                                                    processId: process.id,
                                                    subProcessId: child.id,
                                                    name: child.name,
                                                  })
                                                }
                                                className="text-red-400 hover:bg-red-900/20"
                                              >
                                                <Trash2 className="w-3 h-3 mr-2" />
                                                Delete
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      ))}
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
                </CardContent>
              </Card>
            )
          })}
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
        <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete the 
              {deleteDialog.type === "subprocess" ? "sub-process" : deleteDialog.type === "part" ? "part" : "process"} "
              {deleteDialog.name}"?
              {deleteDialog.type === "process" && " This will also delete all its sub-processes."}
              {deleteDialog.type === "part" && " This will also delete all its processes and sub-processes."}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
