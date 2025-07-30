"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "../components/card"
import { Badge } from "../components/badge"
import { Button } from "../components/button"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/dialog"
import { useAuth } from "../../../main_view/contexts/AuthContext"
import {
  Package,
  CheckCircle2,
  Clock,
  BarChart3,
  Zap,
  Target,
  Award,
  Activity,
  Wrench,
  Cog,
  Shield,
  Sparkles,
  FileText,
  MessageSquare,
  ExternalLink,
  Edit,
  LogOut,
  User,
} from "lucide-react"

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

// Sample Data
const initialParts: Part[] = [
  {
    id: "1",
    partName: "Engine Block",
    partNumber: "ENG-001",
    customer: "Toyota Motor",
    progress: [
      {
        id: "machining",
        name: "Machining",
        processes: [
          {
            id: "rough-machining",
            name: "Rough Machining",
            completed: true,
            notes: "Completed ahead of schedule. All dimensions within tolerance.",
            children: [
              { id: "setup", name: "Setup Mesin", completed: true, notes: "Machine calibrated successfully" },
              {
                id: "cutting",
                name: "Proses Cutting",
                completed: true,
                notes: "Used new cutting tools, excellent surface finish",
              },
              {
                id: "inspection-1",
                name: "Inspeksi Dimensi",
                completed: true,
                notes: "All measurements verified and documented",
              },
            ],
          },
          {
            id: "finish-machining",
            name: "Finish Machining",
            completed: false,
            notes: "Waiting for specialized tooling delivery. Expected completion: 2 days.",
            children: [
              {
                id: "fine-cutting",
                name: "Fine Cutting",
                completed: true,
                notes: "Precision cutting completed with 0.01mm tolerance",
              },
              {
                id: "surface-finish",
                name: "Surface Finishing",
                completed: false,
                notes: "Scheduled for tomorrow morning shift",
              },
              { id: "final-inspection", name: "Final Inspection", completed: false },
            ],
          },
        ],
      },
      {
        id: "assembly",
        name: "Assembly",
        processes: [
          {
            id: "pre-assembly",
            name: "Pre Assembly",
            completed: false,
            notes: "Parts cleaning in progress. Assembly area prepared.",
            children: [
              {
                id: "parts-preparation",
                name: "Persiapan Parts",
                completed: true,
                notes: "All components sorted and labeled",
              },
              { id: "cleaning", name: "Cleaning", completed: false, notes: "Using ultrasonic cleaning process" },
            ],
          },
          {
            id: "main-assembly",
            name: "Main Assembly",
            completed: false,
            children: [
              { id: "component-install", name: "Install Komponen", completed: false },
              { id: "torque-check", name: "Torque Check", completed: false },
              { id: "function-test", name: "Function Test", completed: false },
            ],
          },
        ],
      },
      {
        id: "quality-control",
        name: "Quality Control",
        processes: [
          {
            id: "dimensional-check",
            name: "Dimensional Check",
            completed: false,
            children: [
              { id: "measurement", name: "Pengukuran", completed: false },
              { id: "documentation", name: "Dokumentasi", completed: false },
            ],
          },
          {
            id: "final-qa",
            name: "Final QA",
            completed: false,
            notes: "QA checklist prepared. Waiting for assembly completion.",
            children: [
              { id: "visual-inspection", name: "Visual Inspection", completed: false },
              { id: "performance-test", name: "Performance Test", completed: false },
              { id: "packaging", name: "Packaging", completed: false, notes: "Custom packaging design approved" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "2",
    partName: "Transmission Gear",
    partNumber: "TRN-002",
    customer: "Honda Motors",
    progress: [
      {
        id: "forging",
        name: "Forging",
        processes: [
          {
            id: "heating",
            name: "Heating Process",
            completed: true,
            notes: "Optimal temperature achieved. Material properties verified.",
            children: [
              {
                id: "furnace-setup",
                name: "Setup Furnace",
                completed: true,
                notes: "Temperature calibration completed",
              },
              {
                id: "temperature-control",
                name: "Temperature Control",
                completed: true,
                notes: "Maintained at 1200°C for 45 minutes",
              },
              {
                id: "heating-time",
                name: "Heating Time",
                completed: true,
                notes: "Heating cycle completed successfully",
              },
            ],
          },
          {
            id: "forming",
            name: "Forming Process",
            completed: true,
            notes: "Excellent forming results. No defects detected.",
            children: [
              { id: "die-setup", name: "Die Setup", completed: true, notes: "New die installed and tested" },
              {
                id: "press-operation",
                name: "Press Operation",
                completed: true,
                notes: "Applied 500 tons pressure as specified",
              },
              { id: "cooling", name: "Cooling", completed: true, notes: "Controlled cooling rate maintained" },
            ],
          },
        ],
      },
      {
        id: "heat-treatment",
        name: "Heat Treatment",
        processes: [
          {
            id: "hardening",
            name: "Hardening",
            completed: true,
            notes: "Hardness test results: 58-62 HRC. Within specification.",
            children: [
              { id: "quenching", name: "Quenching", completed: true, notes: "Oil quenching at 850°C" },
              { id: "tempering", name: "Tempering", completed: true, notes: "Tempered at 200°C for 2 hours" },
            ],
          },
        ],
      },
      {
        id: "finishing",
        name: "Finishing",
        processes: [
          {
            id: "grinding",
            name: "Grinding",
            completed: false,
            notes: "Precision grinding scheduled for next shift.",
            children: [
              {
                id: "rough-grinding",
                name: "Rough Grinding",
                completed: true,
                notes: "Surface roughness achieved: Ra 1.6",
              },
              {
                id: "fine-grinding",
                name: "Fine Grinding",
                completed: false,
                notes: "Waiting for fine grinding wheel replacement",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "3",
    partName: "Brake Disc",
    partNumber: "BRK-003",
    customer: "Nissan Motors",
    progress: [
      {
        id: "casting",
        name: "Casting",
        processes: [
          {
            id: "mold-preparation",
            name: "Mold Preparation",
            completed: true,
            notes: "Mold inspection passed. Ready for casting.",
            children: [
              { id: "mold-setup", name: "Mold Setup", completed: true, notes: "Mold assembled and secured" },
              {
                id: "mold-inspection",
                name: "Mold Inspection",
                completed: true,
                notes: "No defects found in mold cavity",
              },
            ],
          },
          {
            id: "pouring",
            name: "Pouring",
            completed: true,
            notes: "Casting completed successfully. No porosity detected.",
            children: [
              { id: "metal-heating", name: "Metal Heating", completed: true, notes: "Iron heated to 1500°C" },
              {
                id: "pouring-process",
                name: "Pouring Process",
                completed: true,
                notes: "Smooth pouring, no splashing",
              },
              { id: "cooling", name: "Cooling", completed: true, notes: "Cooling time: 4 hours as specified" },
            ],
          },
        ],
      },
      {
        id: "machining",
        name: "Machining",
        processes: [
          {
            id: "turning",
            name: "Turning",
            completed: true,
            notes: "Turning operation completed with excellent surface finish.",
            children: [
              { id: "rough-turning", name: "Rough Turning", completed: true, notes: "Material removal completed" },
              { id: "finish-turning", name: "Finish Turning", completed: true, notes: "Final dimensions achieved" },
            ],
          },
          {
            id: "drilling",
            name: "Drilling",
            completed: false,
            notes: "Drilling holes for mounting bolts. 3 of 5 holes completed.",
            children: [
              {
                id: "center-drilling",
                name: "Center Drilling",
                completed: true,
                notes: "Center holes marked and drilled",
              },
              { id: "hole-drilling", name: "Hole Drilling", completed: false, notes: "Using 12mm carbide drill bits" },
            ],
          },
        ],
      },
    ],
  },
]

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

const calculateCategoryProgress = (processes: Process[]): number => {
  let totalTasks = 0
  let completedTasks = 0

  const countTasks = (process: Process) => {
    if (process.children && process.children.length > 0) {
      process.children.forEach((child) => {
        totalTasks++
        if (child.completed) completedTasks++
      })
    } else {
      totalTasks++
      if (process.completed) completedTasks++
    }
  }

  processes.forEach(countTasks)
  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
}

// Process Detail Modal Component
interface ProcessDetailModalProps {
  isOpen: boolean
  onClose: () => void
  process: Process | null
  categoryName: string
  processProgress: number
}

function ProcessDetailModal({ isOpen, onClose, process, categoryName, processProgress }: ProcessDetailModalProps) {
  if (!process) return null

  const getStatusInfo = (progress: number) => {
    if (progress === 100) return { color: "from-green-500 to-emerald-600", textColor: "text-green-400" }
    if (progress >= 75) return { color: "from-blue-500 to-cyan-600", textColor: "text-blue-400" }
    if (progress >= 50) return { color: "from-yellow-500 to-orange-500", textColor: "text-yellow-400" }
    if (progress >= 25) return { color: "from-purple-500 to-pink-500", textColor: "text-purple-400" }
    return { color: "from-gray-500 to-gray-600", textColor: "text-gray-400" }
  }

  const statusInfo = getStatusInfo(processProgress)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 text-white">
        <DialogHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white mb-1">{process.name}</DialogTitle>
                <p className="text-gray-400">{categoryName} Category</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white mb-1">{processProgress}%</div>
              <Badge className={`${statusInfo.textColor} bg-gray-800 border-gray-600 font-bold`}>
                {processProgress === 100 ? "Completed" : processProgress > 0 ? "In Progress" : "Not Started"}
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${statusInfo.color} transition-all duration-1000 ease-out rounded-full relative`}
                style={{ width: `${processProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Process Notes */}
          {process.notes && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="text-sm font-semibold text-blue-300 mb-2">Process Notes</h5>
                  <p className="text-sm text-blue-200 leading-relaxed">{process.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Sub-processes */}
          {process.children && process.children.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Sub-processes</h3>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    {process.children.filter((child) => child.completed).length} Completed
                  </Badge>
                  <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/30">
                    {process.children.filter((child) => !child.completed).length} Pending
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {process.children.map((child, childIndex) => (
                  <Card
                    key={child.id}
                    className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-lg"
                    style={{
                      animation: `slideInUp 0.4s ease-out ${childIndex * 100}ms both`,
                    }}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`w-4 h-4 rounded-full flex-shrink-0 ${
                              child.completed
                                ? "bg-green-400 shadow-green-400/50 shadow-lg"
                                : "bg-gray-500 animate-pulse"
                            }`}
                          ></div>
                          <div className="flex-1">
                            <h4
                              className={`font-semibold mb-1 ${child.completed ? "text-green-400" : "text-gray-300"}`}
                            >
                              {child.name}
                            </h4>
                            <div className="flex items-center gap-2">
                              {child.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              ) : (
                                <Clock className="w-4 h-4 text-gray-500" />
                              )}
                              <Badge
                                className={`text-xs font-semibold ${
                                  child.completed
                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                    : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                }`}
                              >
                                {child.completed ? "Completed" : "In Progress"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar for Child */}
                      <div className="mb-4">
                        <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-1000 rounded-full ${
                              child.completed
                                ? "bg-gradient-to-r from-green-400 to-green-500"
                                : "bg-gradient-to-r from-orange-400 to-orange-500"
                            }`}
                            style={{ width: child.completed ? "100%" : "60%" }}
                          ></div>
                        </div>
                      </div>

                      {/* Child Notes */}
                      {child.notes && (
                        <div className="p-3 bg-gray-600/30 rounded-lg border border-gray-600/20">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-400 mb-1 font-medium">Notes:</p>
                              <p className="text-sm text-gray-300 leading-relaxed">{child.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {process.children ? process.children.length : 0}
                </div>
                <div className="text-sm text-blue-300">Total Tasks</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {process.children ? process.children.filter((child) => child.completed).length : 0}
                </div>
                <div className="text-sm text-green-300">Completed</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-400 mb-1">
                  {process.children ? process.children.filter((child) => !child.completed).length : 0}
                </div>
                <div className="text-sm text-orange-300">Remaining</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main Dashboard Component
export default function Dashboard() {
  const [parts, setParts] = useState<Part[]>(initialParts)
  const { user, handleLogout } = useAuth()
  const navigate = useNavigate()
  const [selectedProcess, setSelectedProcess] = useState<{
    process: Process
    categoryName: string
    processProgress: number
  } | null>(null)

  // Load data from localStorage on mount
  useEffect(() => {
    const savedParts = localStorage.getItem("parts-data")
    if (savedParts) {
      setParts(JSON.parse(savedParts))
    }
  }, [])

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedParts = localStorage.getItem("parts-data")
      if (savedParts) {
        setParts(JSON.parse(savedParts))
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("parts-updated", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("parts-updated", handleStorageChange)
    }
  }, [])

  // Open process detail modal
  const openProcessDetail = (process: Process, categoryName: string) => {
    const processProgress = calculateProcessProgress(process)
    setSelectedProcess({ process, categoryName, processProgress })
  }

  // Close process detail modal
  const closeProcessDetail = () => {
    setSelectedProcess(null)
  }

  // Get pie chart data with enhanced styling
  const getPieChartData = (part: Part) => {
    const progressPercentage = calculateOverallProgress(part)
    return [
      { name: "Completed", value: progressPercentage, color: "#10B981" },
      { name: "Remaining", value: 100 - progressPercentage, color: "#1F2937" },
    ]
  }

  // Get status with enhanced styling
  const getStatusInfo = (progress: number) => {
    if (progress === 100)
      return {
        color: "from-green-500 to-emerald-600",
        text: "Completed",
        icon: CheckCircle2,
        textColor: "text-green-400",
      }
    if (progress >= 75)
      return { color: "from-blue-500 to-cyan-600", text: "Near Completion", icon: Target, textColor: "text-blue-400" }
    if (progress >= 50)
      return {
        color: "from-yellow-500 to-orange-500",
        text: "In Progress",
        icon: Activity,
        textColor: "text-yellow-400",
      }
    if (progress >= 25)
      return { color: "from-purple-500 to-pink-500", text: "Started", icon: Zap, textColor: "text-purple-400" }
    return { color: "from-gray-500 to-gray-600", text: "Not Started", icon: Clock, textColor: "text-gray-400" }
  }

  // Get category icon
  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "machining":
        return Wrench
      case "assembly":
        return Cog
      case "quality control":
        return Shield
      case "forging":
        return Zap
      case "heat treatment":
        return Activity
      case "finishing":
        return Sparkles
      case "casting":
        return Package
      default:
        return BarChart3
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header/Navigation Bar */}
      <header className="border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/tools">
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent">
                  ← Kembali
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Progress Tracker
                  </h1>
                  <p className="text-sm text-gray-400">Pantau progres produksi</p>
                </div>
              </div>
            </div>

            {/* User Info and Logout */}
            {user && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700/50">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">{user.nama || user.username}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent flex items-center gap-2"
                  onClick={() => handleLogout()}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with title and manage button */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              Progress Tracker Dashboard
            </h1>
            <Link to="/progress/manage">
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Manage Progress
              </Button>
            </Link>
          </div>
          {/* Enhanced Parts List */}
          <div className="grid grid-cols-1 gap-8">
            {parts.map((part, index) => {
              const overallProgress = calculateOverallProgress(part)
              const statusInfo = getStatusInfo(overallProgress)
              const StatusIcon = statusInfo.icon

              return (
                <Card
                  key={part.id}
                  className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-500 hover:shadow-2xl group animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="pb-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-white" />
                            </div>
                            <CardTitle className="text-2xl text-white font-bold">{part.partName}</CardTitle>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge className="bg-gradient-to-r from-gray-700 to-gray-800 text-gray-200 border-gray-600 px-3 py-1">
                              {part.partNumber}
                            </Badge>
                            <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-500 px-3 py-1">
                              {part.customer}
                            </Badge>
                            <Badge
                              className={`bg-gradient-to-r ${statusInfo.color} text-white border-0 px-3 py-1 flex items-center gap-1`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.text}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-white mb-1">{overallProgress}%</div>
                          <div className="text-sm text-gray-400 font-medium">Overall Progress</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Enhanced Pie Chart */}
                      <div className="flex flex-col items-center">
                        <div className="relative">
                          <div className="h-56 w-56">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={getPieChartData(part)}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={70}
                                  outerRadius={110}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  {getPieChartData(part).map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.color}
                                      stroke={entry.color}
                                      strokeWidth={2}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value) => `${value}%`}
                                  contentStyle={{
                                    backgroundColor: "#1F2937",
                                    border: "1px solid #374151",
                                    borderRadius: "12px",
                                    color: "#F9FAFB",
                                    boxShadow:
                                      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          {/* Center text */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-white">{overallProgress}%</div>
                              <div className="text-sm text-gray-400">Complete</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Categories Progress */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                          <Award className="w-5 h-5 text-yellow-400" />
                          Categories Progress
                        </h4>
                        {part.progress.map((progressCategory) => {
                          const categoryProgress = calculateCategoryProgress(progressCategory.processes)
                          const CategoryIcon = getCategoryIcon(progressCategory.name)
                          return (
                            <div
                              key={progressCategory.id}
                              className="bg-gray-700/50 rounded-xl p-4 backdrop-blur-sm border border-gray-600/50"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <CategoryIcon className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="font-medium text-gray-200">{progressCategory.name}</span>
                                </div>
                                <Badge className={`${statusInfo.textColor} bg-gray-800 border-gray-600 font-bold`}>
                                  {categoryProgress}%
                                </Badge>
                              </div>
                              <div className="relative">
                                <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000 ease-out rounded-full"
                                    style={{ width: `${categoryProgress}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Enhanced Individual Process Progress with Card Layout */}
                    <div className="pt-6 border-t border-gray-700">
                      <h4 className="font-bold text-white mb-6 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        Individual Process Progress
                      </h4>

                      {/* Process Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {part.progress.map((progressCategory) =>
                          progressCategory.processes.map((process) => {
                            const processProgress = calculateProcessProgress(process)
                            const processStatusInfo = getStatusInfo(processProgress)

                            return (
                              <Card
                                key={`${progressCategory.id}-${process.id}`}
                                className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-lg cursor-pointer group"
                                onClick={() => openProcessDetail(process, progressCategory.name)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-3 h-3 rounded-full bg-gradient-to-r ${processStatusInfo.color} shadow-lg`}
                                      ></div>
                                      <span className="font-semibold text-gray-200 group-hover:text-white transition-colors text-sm">
                                        {process.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {process.children && (
                                        <span className="text-xs text-gray-400 bg-gray-600/40 px-2 py-1 rounded-full">
                                          {process.children.filter((child) => child.completed).length}/
                                          {process.children.length}
                                        </span>
                                      )}
                                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-colors" />
                                    </div>
                                  </div>

                                  <div className="mb-3">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-xs text-gray-400">Progress</span>
                                      <Badge
                                        className={`text-xs font-bold ${
                                          processProgress === 100
                                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                                            : processProgress > 0
                                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                              : "bg-gray-600/20 text-gray-400 border-gray-600/30"
                                        }`}
                                      >
                                        {processProgress}%
                                      </Badge>
                                    </div>
                                    <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full bg-gradient-to-r ${processStatusInfo.color} transition-all duration-1000 ease-out rounded-full`}
                                        style={{ width: `${processProgress}%` }}
                                      ></div>
                                    </div>
                                  </div>

                                  {/* Process Notes Preview */}
                                  {process.notes && (
                                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
                                      <div className="flex items-start gap-2">
                                        <MessageSquare className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-blue-200 line-clamp-2">{process.notes}</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Category Badge */}
                                  <div className="mt-3 flex justify-between items-center">
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-gray-800/50 text-gray-300 border-gray-600/50"
                                    >
                                      {progressCategory.name}
                                    </Badge>
                                    {process.children && process.children.length > 0 && (
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        {process.children.length} tasks
                                      </span>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          }),
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {/* Process Detail Modal */}
      <ProcessDetailModal
        isOpen={!!selectedProcess}
        onClose={closeProcessDetail}
        process={selectedProcess?.process || null}
        categoryName={selectedProcess?.categoryName || ""}
        processProgress={selectedProcess?.processProgress || 0}
      />

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
