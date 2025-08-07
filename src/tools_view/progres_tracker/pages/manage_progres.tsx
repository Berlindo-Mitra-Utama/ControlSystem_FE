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

// Import new components
import { ProgressToolingDropdown } from "../components/ProgressToolingDropdown"
import { ProcessFormModal } from "../components/ProcessFormModal"
import { PartFormModal } from "../components/PartFormModal"
import { DeleteConfirmationDialog } from "../components/DeleteConfirmationDialog"
import { PartHeader } from "../components/PartHeader"
import { ProcessCard } from "../components/ProcessCard"
import { EvidenceModal } from "../components/EvidenceModal"

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
// Fungsi untuk menghitung progress detail Progress Tooling
const calculateProgressToolingDetailProgress = (): number => {
  // Ini akan diisi dari ProgressToolingDropdown component
  // Untuk sementara return 0, akan diupdate melalui callback
  return 0
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
                  name: "Progress Tooling",
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

  // State untuk tracking auto-complete events
  const [autoCompleteNotification, setAutoCompleteNotification] = useState<{
    show: boolean
    processName: string
  }>({
    show: false,
    processName: ""
  })

  // State untuk menyimpan progress detail Progress Tooling
  // Progress ini akan diupdate melalui callback dari ProgressToolingDropdown
  // dan digunakan untuk menghitung progress bar tooling dan overall progress
  const [progressToolingDetailProgress, setProgressToolingDetailProgress] = useState<number>(0)

  // Effect untuk memastikan progressToolingDetailProgress ter-update dengan benar
  useEffect(() => {
    if (selectedPart) {
      // Cari Progress Tooling sub-process dan hitung progress detail
      let totalDetailProgress = 0;
      let foundProgressTooling = false;
      
      selectedPart.progress.forEach((category) => {
        category.processes.forEach((process) => {
          if (process.children && process.children.length > 0) {
            process.children.forEach((child) => {
              if (child.name === "Progress Tooling") {
                foundProgressTooling = true;
                // Progress detail akan diupdate melalui callback dari ProgressToolingDropdown
              }
            });
          }
        });
      });
      
      // Jika tidak ada Progress Tooling, reset progress detail
      if (!foundProgressTooling) {
        setProgressToolingDetailProgress(0);
      }
    }
  }, [selectedPart]);

  // Effect untuk memastikan progress bar tooling ter-update ketika progressToolingDetailProgress berubah
  useEffect(() => {
    // Force re-render untuk memastikan progress bar ter-update
  }, [progressToolingDetailProgress]);

  // Fungsi untuk menghitung progress process dengan mempertimbangkan detail Progress Tooling
  const calculateProcessProgressWithDetail = (process: Process): number => {
    // Jika process parent sudah di-complete secara manual, return 100%
    if (process.completed) {
      return 100
    }
    
    // Jika ada sub-process, hitung berdasarkan sub-process
    if (process.children && process.children.length > 0) {
      let totalProgress = 0
      let totalWeight = 0
      
      process.children.forEach((child) => {
        if (child.name === "Progress Tooling") {
          // Gunakan progress detail untuk Progress Tooling
          totalProgress += progressToolingDetailProgress
          totalWeight += 1
        } else {
          // Gunakan status completed untuk sub-process lain
          totalProgress += child.completed ? 100 : 0
          totalWeight += 1
        }
      })
      
      const result = totalWeight > 0 ? Math.round(totalProgress / totalWeight) : 0
      return result
    }
    
    // Jika tidak ada sub-process dan process belum complete, return 0%
    return 0
  }

  // Fungsi untuk menghitung overall progress dengan mempertimbangkan detail Progress Tooling
  const calculateOverallProgressWithDetail = (part: Part): number => {
    let totalTasks = 0
    let completedTasks = 0

    part.progress.forEach((progress) => {
      progress.processes.forEach((process) => {
        if (process.children && process.children.length > 0) {
          // Jika process parent sudah complete, hitung sebagai 1 task completed
          if (process.completed) {
            totalTasks++
            completedTasks++
          } else {
            // Hitung berdasarkan sub-process
            process.children.forEach((child) => {
              totalTasks++
              if (child.name === "Progress Tooling") {
                // Gunakan progress detail untuk Progress Tooling
                completedTasks += Math.round(progressToolingDetailProgress / 100)
              } else {
                // Gunakan status completed untuk sub-process lain
                if (child.completed) completedTasks++
              }
            })
          }
        } else {
          // Process tanpa sub-process
          totalTasks++
          if (process.completed) completedTasks++
        }
      })
    })

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  }

  // Function to set evidence modal with proper callback
  const setEvidenceModalWithCallback = (modalData: {
    isOpen: boolean
    processId?: string
    subProcessId?: string
    processName: string
    evidence: Evidence[]
    categoryId?: string
  }) => {
    setEvidenceModal({
      ...modalData,
      onEvidenceChange: (evidence: Evidence[]) => {
        if (selectedPart) {
          handleEvidenceUpdate(
            selectedPart.id,
            modalData.categoryId || "",
            modalData.processId || "",
            modalData.subProcessId || null,
            evidence
          );
        }
      }
    });
  };

  const handleEvidenceUpdate = (partId: string, categoryId: string, processId: string, subProcessId: string | null, evidence: Evidence[]) => {
    try {
      let updatedParts: Part[]
      
      // Find the category ID if not provided
      let actualCategoryId = categoryId;
      if (!actualCategoryId && selectedPart) {
        for (const category of selectedPart.progress) {
          const process = category.processes.find(p => p.id === processId);
          if (process) {
            actualCategoryId = category.id;
            break;
          }
        }
      }
      
      if (subProcessId) {
        // Update sub-process evidence
        updatedParts = parts.map(part => {
          if (part.id === partId) {
            return {
              ...part,
              progress: part.progress.map(category => {
                if (category.id === actualCategoryId) {
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
                if (category.id === actualCategoryId) {
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

  // Load data from localStorage on mount and update Design Tooling to Progress Tooling
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
          // Update semua nama 'Design Tooling' menjadi 'Progress Tooling' secara rekursif
          const updatedParts = parsedParts.map(part => ({
            ...part,
            progress: part.progress.map(category => ({
              ...category,
              processes: renameDesignToolingToProgressTooling(category.processes)
            }))
          }))
          setParts(updatedParts)
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

  // Auto-update process completion when sub-processes change
  useEffect(() => {
    if (selectedPart) {
      const updatedParts = parts.map(part => {
        if (part.id === selectedPart.id) {
          return {
            ...part,
            progress: part.progress.map(category => ({
              ...category,
              processes: category.processes.map(process => {
                const updatedProcess = updateProcessCompletion(process)
                
                // Check if process was just auto-completed
                if (updatedProcess.completed && process.children && process.children.length > 0) {
                  const wasCompletedBefore = process.completed
                  const allChildrenCompleted = process.children.every(child => child.completed)
                  
                  if (!wasCompletedBefore && allChildrenCompleted) {
                    // Show notification for auto-complete
                    setAutoCompleteNotification({
                      show: true,
                      processName: process.name
                    })
                    
                    // Auto-hide notification after 3 seconds
                    setTimeout(() => {
                      setAutoCompleteNotification({ show: false, processName: "" })
                    }, 3000)
                  }
                }
                
                return updatedProcess
              })
            }))
          }
        }
        return part
      })
      
      // Only update if there are actual changes
      const hasChanges = JSON.stringify(updatedParts) !== JSON.stringify(parts)
      if (hasChanges) {
        setParts(updatedParts)
        setSelectedPart(updatedParts.find(p => p.id === selectedPart.id) || null)
        
        // Save to storage
        try {
          const partsDataString = JSON.stringify(updatedParts)
          localStorage.setItem("parts-data", partsDataString)
          sessionStorage.setItem("parts-data-backup", partsDataString)
          window.dispatchEvent(new Event("parts-updated"))
        } catch (error) {
          console.error("Error saving auto-updated process completion:", error)
        }
      }
    }
  }, [selectedPart, parts])

  // Helper function untuk Progress Tooling yang hanya bisa auto-complete
  const isProgressToolingAutoCompleted = (process: Process): boolean => {
    if (!process.children || process.children.length === 0) return false;
    
    // Cari Progress Tooling sub-process
    const progressToolingChild = process.children.find(child => child.name === "Progress Tooling");
    if (!progressToolingChild) return false;
    
    return progressToolingChild.completed;
  }

  // Helper function to check if process was auto-completed
  const isProcessAutoCompleted = (process: Process): boolean => {
    return process.completed && process.children && process.children.length > 0 && 
           process.children.every(child => child.completed)
  }

  // Helper function to check and update process completion based on sub-processes
  const updateProcessCompletion = (process: Process): Process => {
    if (process.children && process.children.length > 0) {
      const allChildrenCompleted = process.children.every(child => child.completed)
      return {
        ...process,
        completed: allChildrenCompleted
      }
    }
    return process
  }

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
                  // Cek apakah ini Progress Tooling yang ingin di-toggle manual
                  const child = process.children.find(c => c.id === childId);
                  if (child && child.name === "Progress Tooling") {
                    // Progress Tooling tidak bisa di-toggle manual sama sekali
                    return process;
                  }
                  
                  // Update sub-process completion
                  const updatedChildren = process.children.map((child) =>
                    child.id === childId ? { ...child, completed: !child.completed } : child,
                  )
                  
                  // Check if all sub-processes are completed
                  const allChildrenCompleted = updatedChildren.length > 0 && updatedChildren.every(child => child.completed)
                  
                  return {
                    ...process,
                    children: updatedChildren,
                    // Auto-complete process if all children are completed
                    completed: allChildrenCompleted
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

  // Fungsi rekursif untuk mengganti semua nama 'Design Tooling' menjadi 'Progress Tooling'
  function renameDesignToolingToProgressTooling(processes) {
    return processes.map(process => {
      let updatedProcess = { ...process };
      if (updatedProcess.name === "Design Tooling") {
        updatedProcess.name = "Progress Tooling";
      }
      if (updatedProcess.children && updatedProcess.children.length > 0) {
        updatedProcess.children = renameDesignToolingToProgressTooling(updatedProcess.children);
      }
      return updatedProcess;
    });
  }

  return (  
    <div className={`min-h-screen ${uiColors.bg.primary} ${uiColors.text.primary} p-3 sm:p-4 md:p-6`}>
      {/* Auto-complete Notification */}
      {autoCompleteNotification.show && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg border border-green-500 transform transition-all duration-300 ease-out animate-bounce">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">
              "{autoCompleteNotification.processName}" auto-completed!
            </span>
          </div>
          <p className="text-sm mt-1 opacity-90">
            All sub-processes are now complete
          </p>
        </div>
      )}

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
                <div className="mt-2 flex items-center space-x-2 text-xs text-blue-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Processes auto-complete when all sub-processes are finished • Green checkmark indicates completed items • Progress Tooling auto-completes when overall progress reaches 100%</span>
                </div>
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
                      <div 
                        key={`overall-percentage-${selectedPart.id}-${progressToolingDetailProgress}`}
                        className={`text-2xl sm:text-3xl md:text-4xl font-bold ${uiColors.text.primary}`}
                      >
                        {calculateOverallProgressWithDetail(selectedPart)}%
                      </div>
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
                  <Progress 
                    key={`overall-${selectedPart.id}-${progressToolingDetailProgress}`}
                    value={calculateOverallProgressWithDetail(selectedPart)} 
                    className={`h-2 sm:h-3 ${uiColors.bg.secondary}`} 
                  />
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
                            const processProgress = calculateProcessProgressWithDetail(process)
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
                                      {isProcessAutoCompleted(process) && (
                                        <span className="ml-2 text-xs text-blue-400 font-normal">
                                          (Auto-completed)
                                        </span>
                                      )}
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      key={`${process.id}-badge-${progressToolingDetailProgress}`}
                                      variant="outline"
                                      className={`text-xs ${progressColors.color} ${progressColors.textColor} border-current`}
                                    >
                                      {processProgress}%
                                    </Badge>
                                    {process.children && process.children.length > 0 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-gray-600 text-gray-300 border-gray-500"
                                      >
                                        {process.children.filter(child => child.completed).length}/{process.children.length} sub
                                      </Badge>
                                    )}
                                    {isProcessAutoCompleted(process) && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-blue-600 text-white border-blue-500"
                                      >
                                        Auto
                                      </Badge>
                                    )}
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
                                      setEvidenceModalWithCallback({
                                        isOpen: true,
                                        processId: process.id,
                                        processName: process.name,
                                        evidence: process.evidence || [],
                                        categoryId: progressCategory.id,
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
                                  <Progress 
                                    key={`${process.id}-${progressToolingDetailProgress}`}
                                    value={processProgress} 
                                    className={`h-2 ${uiColors.bg.secondary}`} 
                                  />
                                  {process.name === "Tooling" && (
                                    <div className="mt-1 text-xs text-blue-400">
                                      Progress includes Progress Tooling detail: {progressToolingDetailProgress}%
                                    </div>
                                  )}
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
                                              id={`${selectedPart.id}-${progressCategory.id}-${process.id}-${child.id}`}
                                              checked={child.completed && progressToolingDetailProgress === 100}
                                              onCheckedChange={() =>
                                                toggleProcess(selectedPart.id, progressCategory.id, process.id, child.id)
                                              }
                                                className={`${uiColors.border.tertiary} ${
                                                  child.name === "Progress Tooling" ? "opacity-50 cursor-not-allowed" : ""
                                                }`}
                                                disabled={child.name === "Progress Tooling"}
                                            />
                                            <label
                                              htmlFor={`${selectedPart.id}-${progressCategory.id}-${process.id}-${child.id}`}
                                              className={`text-sm cursor-pointer flex-1 break-words ${
                                                  child.name === "Progress Tooling" 
                                                    ? `${uiColors.text.secondary} opacity-60 cursor-not-allowed` 
                                                    : uiColors.text.secondary
                                              }`}
                                            >
                                              {child.name}
                                                {child.name === "Progress Tooling" && (
                                                  <span className="ml-2 text-xs text-blue-400 font-normal">
                                                    {progressToolingDetailProgress === 100 ? "(Completed)" : `(Overall Progress: ${progressToolingDetailProgress}%)`}
                                                  </span>
                                                )}
                                                {child.completed && progressToolingDetailProgress === 100 && (
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
                                                  setEvidenceModalWithCallback({
                                                  isOpen: true,
                                                  processId: process.id,
                                                  subProcessId: child.id,
                                                  processName: child.name,
                                                  evidence: child.evidence || [],
                                                    categoryId: progressCategory.id,
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
                                          
                                          {/* Second row: Progress Tooling Dropdown (only for Progress Tooling) */}
                                          {child.name === "Progress Tooling" && (
                                            <div className="w-full mt-2">
                                              <ProgressToolingDropdown 
                                                progressToolingChild={child}
                                                onProgressToolingComplete={(completed) => {
                                                  if (completed) {
                                                    // Auto-complete the Progress Tooling sub-process
                                                    toggleProcess(selectedPart.id, progressCategory.id, process.id, child.id);
                                                  }
                                                }}
                                                onProgressUpdate={(progress) => {
                                                  setProgressToolingDetailProgress(progress);
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
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => {
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
        }}
        onConfirm={handleDelete}
        type={deleteDialog.type}
        name={deleteDialog.name}
      />

      {/* Evidence Modal */}
      <EvidenceModal
        isOpen={evidenceModal.isOpen}
        onClose={() => setEvidenceModal({ ...evidenceModal, isOpen: false })}
        processName={evidenceModal.processName}
        evidence={evidenceModal.evidence}
        onEvidenceChange={evidenceModal.onEvidenceChange}
      />
    </div>
  );
}
