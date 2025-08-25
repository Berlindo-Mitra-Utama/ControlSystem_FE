"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/card"
import { Badge } from "../components/badge"
import { Checkbox } from "../components/checkbox"
import { Button } from "../components/button"
import { Progress } from "../components/progress"
// removed unused: Input, Textarea, Label
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/dialog"
// removed unused: DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
// removed unused AlertDialog components
import { Plus, Edit, Trash2, Upload, FileText, Image, Download } from "lucide-react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { getProgressColor, getUIColors } from "../../const/colors"
import { updatePart, getAllParts, deletePart, updateProcessCompletion as apiUpdateProcessCompletion, updateProgressDetail, updateProgressToolingDetail as apiUpdateProgressToolingDetail, getProgressToolingDetail, getPartWithProgress, upsertProgressToolingTrials, getProgressToolingTrials } from '../../../services/API_Services'

// Import new components
import { ProgressToolingDropdown } from "../components/ProgressToolingDropdown"
import { ProcessFormModal } from "../components/ProcessFormModal"
import { PartFormModal } from "../components/PartFormModal"
import { DeleteConfirmationDialog } from "../components/DeleteConfirmationDialog"
import { PartHeader } from "../components/PartHeader"
import { ProcessCard } from "../components/ProcessCard"
import { EvidenceModal } from "../components/EvidenceModal"
import { getProcessEvidence, deleteEvidence } from "../../../services/API_Services"

// Import light mode components
import { ManageProgressHeader } from "../components/ManageProgressHeader"
import { ProgressOverviewCard } from "../components/ProgressOverviewCard"
import { SaveButton } from "../components/SaveButton"
import { ImageModal } from "../components/ImageModal"
import { CategoryCard } from "../components/CategoryCard"
import { useTheme } from '../../../contexts/ThemeContext'

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
  toolingDetail?: any
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
  createdAt?: string
  status?: string
  partImage?: string
  partImageUrl?: string
}

// Helper function to validate base64 image data
const isValidBase64Image = (data: string): boolean => {
  if (!data || typeof data !== 'string') return false;
  
  // Check if it's a valid data URL
  if (!data.startsWith('data:image/')) return false;
  
  // Check if it has base64 data
  const base64Data = data.split(',')[1];
  if (!base64Data) return false;
  
  // Basic validation - check if it's valid base64
  try {
    // Try to decode a small portion to validate
    const testData = base64Data.substring(0, 100);
    atob(testData);
    return true;
  } catch (error) {
    console.error('Invalid base64 data:', error);
    return false;
  }
};

// Helper function to map backend part data to frontend Part type
function mapBackendPartToFrontend(part: any): Part {
  // Get image data from backend
  let partImageUrl = part.partImageUrl || part.partImage || '';
  
  console.log('Original partImageUrl:', partImageUrl);
  console.log('Full part data:', part);
  
  // Check if it's valid base64 data
  if (partImageUrl && isValidBase64Image(partImageUrl)) {
    // It's valid base64 data, use it directly
    console.log('Using valid base64 image data');
  } else if (partImageUrl && !partImageUrl.startsWith('http')) {
    // Legacy URL handling - if it's a relative path, add base URL
    if (!partImageUrl.startsWith('/')) {
      partImageUrl = `/${partImageUrl}`;
    }
    partImageUrl = `http://localhost:5555${partImageUrl}`;
  } else if (partImageUrl && partImageUrl.startsWith('http') && !partImageUrl.includes('localhost')) {
    // Skip external URLs that might cause CORS issues, but allow localhost
    partImageUrl = '';
  }
  
  console.log('Final partImageUrl:', partImageUrl);

  // Handle progress data mapping with proper structure preservation
  let progressData = [];
  
  if (part.ProgressCategories && Array.isArray(part.ProgressCategories)) {
    // Backend returns ProgressCategories with nested structure
    progressData = part.ProgressCategories.map((category: any) => ({
      id: category.id?.toString() || generateId(),
      name: category.name || '',
      processes: category.processes ? category.processes.map((process: any) => ({
        id: process.id?.toString() || generateId(),
        name: process.name || '',
        completed: !!process.completed, // Ensure boolean - read from database
        notes: process.notes || '',
        children: process.children ? process.children.map((child: any) => ({
          id: child.id?.toString() || generateId(),
          name: child.name || '',
          completed: !!child.completed, // Ensure boolean - read from database
          notes: child.notes || '',
          evidence: child.evidence || [],
          toolingDetail: child.toolingDetail || null
        })) : [],
        evidence: process.evidence || []
      })) : []
    }));
  } else if (part.progress && Array.isArray(part.progress)) {
    // Fallback to direct progress data
    progressData = part.progress;
  }

  console.log('Mapped progress data:', progressData);
  console.log('Process completion status from backend:');
  progressData.forEach((category: any) => {
    category.processes.forEach((process: any) => {
      console.log(`- ${process.name}: ${process.completed}`);
      if (process.children) {
        process.children.forEach((child: any) => {
          console.log(`  - ${child.name}: ${child.completed}`);
        });
      }
    });
  });

  return {
    id: part.id?.toString() || generateId(),
    partName: part.partName || part.name || '',
    partNumber: part.partNumber || '',
    customer: part.customer || '',
    progress: progressData,
    createdAt: part.createdAt || new Date().toISOString(),
    status: part.status || 'active',
    partImage: part.partImage || '',
    partImageUrl: partImageUrl,
  };
}

// Utility Functions
// Fungsi untuk menghitung progress detail Progress Tooling
const calculateProgressToolingDetailProgress = (): number => {
  // Ini akan diisi dari ProgressToolingDropdown component
  // Untuk sementara return 0, akan diupdate melalui callback
  return 0
}

// Function to create comprehensive default progress structure
const createComprehensiveProgressStructure = (): ProgressCategory[] => {
  return [
    {
      id: generateId(),
      name: "1. Drawing Part",
      processes: [
        {
          id: generateId(),
          name: "Drawing Part",
          completed: false,
          notes: "",
          children: [
            {
              id: generateId(),
              name: "Comp/Assy",
              completed: false,
              notes: "",
              evidence: []
            },
            {
              id: generateId(),
              name: "Child Part",
              completed: false,
              notes: "",
              evidence: []
            }
          ],
          evidence: []
        }
      ]
    },
    {
      id: generateId(),
      name: "2. SPK",
      processes: [
        {
          id: generateId(),
          name: "Surat Perintah Kerja (SPK)",
          completed: false,
          notes: "",
          evidence: []
        }
      ]
    },
    {
      id: generateId(),
      name: "3. Master Schedule",
      processes: [
        {
          id: generateId(),
          name: "Master Schedule",
          completed: false,
          notes: "",
          evidence: []
        }
      ]
    },
    {
      id: generateId(),
      name: "4. PPAP (Production Part Approval Process)",
      processes: [
        {
          id: generateId(),
          name: "Product Review",
          completed: false,
          notes: "",
          evidence: []
        },
        {
          id: generateId(),
          name: "Engineering Change Document",
          completed: false,
          notes: "",
          evidence: []
        },
        {
          id: generateId(),
          name: "Engineering Approval",
          completed: false,
          notes: "",
          evidence: []
        },
        {
          id: generateId(),
          name: "Process Flow Diagram",
          completed: false,
          notes: "",
          evidence: []
        },
        {
          id: generateId(),
          name: "FMEA",
          completed: false,
          notes: "",
          evidence: []
        },
        {
          id: generateId(),
          name: "Control Plan",
          completed: false,
          notes: "",
          children: [
            {
              id: generateId(),
              name: "QCPC",
              completed: false,
              notes: "",
              evidence: []
            },
            {
              id: generateId(),
              name: "Part Insp. Standar",
              completed: false,
              notes: "",
              evidence: []
            },
            {
              id: generateId(),
              name: "Check Sheet",
              completed: false,
              notes: "",
              evidence: []
            }
          ],
          evidence: []
        },
        {
          id: generateId(),
          name: "Measurement System Analyst (MSA)",
          completed: false,
          notes: "",
          evidence: []
        },
        {
          id: generateId(),
          name: "Dimensional Result",
          completed: false,
          notes: "",
          children: [
            {
              id: generateId(),
              name: "ISIR",
              completed: false,
              notes: "",
              evidence: []
            },
            {
              id: generateId(),
              name: "Check Sheet",
              completed: false,
              notes: "",
              evidence: []
            }
          ],
          evidence: []
        },
        {
          id: generateId(),
          name: "Material and Performance Test Result",
          completed: false,
          notes: "",
          children: [
            {
              id: generateId(),
              name: "MillSheet",
              completed: false,
              notes: "",
              evidence: []
            }
            // Custom tests can be added manually by user using the "Add Sub" button
          ],
          evidence: []
        },
        {
          id: generateId(),
          name: "Sample Production Part",
          completed: false,
          notes: "",
          evidence: []
        }
      ]
    },
    {
      id: generateId(),
      name: "5. Tooling",
      processes: [
        {
          id: generateId(),
          name: "Tooling",
          completed: false,
          notes: "",
          children: [
            {
              id: generateId(),
              name: "Master Schedule Tooling",
              completed: false,
              notes: "",
              evidence: []
            },
            {
              id: generateId(),
              name: "Trial Tooling Report",
              completed: false,
              notes: "",
              evidence: []
            },
            {
              id: generateId(),
              name: "Progress Tooling",
              completed: false,
              notes: "",
              evidence: []
            }
          ],
          evidence: []
        }
      ]
    },
    {
      id: generateId(),
      name: "6. Approval",
      processes: [
        {
          id: generateId(),
          name: "Approval",
          completed: false,
          notes: "",
          evidence: []
        }
      ]
    }
  ]
}

// Function to ensure part has comprehensive progress structure
const ensureComprehensiveProgressStructure = (part: Part): Part => {
  // Always create the comprehensive structure to ensure all processes are present
  // This will override any existing structure with the complete one
    return {
      ...part,
    progress: createComprehensiveProgressStructure()
  }
}

// Function to update existing part with comprehensive structure (for button click)
const updatePartWithComprehensiveStructure = (part: Part): Part => {
  console.log('Updating part with comprehensive structure:', part.partName);
  return ensureComprehensiveProgressStructure(part);
}

const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

// Helper untuk validasi ID (ID dari database - bisa UUID atau numeric)
const isValidUuid = (value: string | number | undefined | null): boolean => {
  if (!value) return false
  
  // Jika numeric ID (seperti 4, 5, 6, dst)
  if (typeof value === 'number' && value > 0) return true
  
  // Jika string, cek apakah numeric atau UUID
  if (typeof value === 'string') {
    // Jika numeric string (seperti "4", "5", "6", dst)
    if (/^\d+$/.test(value) && parseInt(value) > 0) return true
    
    // Jika UUID v4 pattern: 36 chars dengan '-'
    if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value)) return true
  }
  
  return false
}

// Test function untuk debugging
const testIsValidUuid = () => {
  console.log('🧪 Testing isValidUuid function:');
  console.log('isValidUuid(4):', isValidUuid(4));
  console.log('isValidUuid("4"):', isValidUuid("4"));
  console.log('isValidUuid("abc"):', isValidUuid("abc"));
  console.log('isValidUuid(null):', isValidUuid(null));
  console.log('isValidUuid(undefined):', isValidUuid(undefined));
}

// Helper functions untuk update overall progress
const updateProcessOverallProgress = async (processId: string, overallProgress: number): Promise<any> => {
  try {
    const response = await fetch(`http://localhost:5555/api/processes/${processId}/overall-progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).accessToken : ''}`
      },
      body: JSON.stringify({ overallProgress })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating process overall progress:', error);
    throw error;
  }
}

const updatePartOverallProgress = async (partId: string, overallProgress: number): Promise<any> => {
  try {
    const response = await fetch(`http://localhost:5555/api/parts/${partId}/overall-progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).accessToken : ''}`
      },
      body: JSON.stringify({ overallProgress })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating part overall progress:', error);
    throw error;
  }
}

// Local utility functions for process management
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
  const [parts, setParts] = useState<Part[]>([])
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [showDetailedProcesses, setShowDetailedProcesses] = useState(false)
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()

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
      tertiary: isDarkMode ? 'border-gray-500' : 'border-gray-100',
      accent: isDarkMode ? 'border-blue-500' : 'border-blue-600',
      error: isDarkMode ? 'border-red-500' : 'border-red-600'
    },
    text: {
      primary: isDarkMode ? 'text-white' : 'text-gray-900',
      secondary: isDarkMode ? 'text-gray-300' : 'text-gray-700',
      tertiary: isDarkMode ? 'text-gray-400' : 'text-gray-600',
      accent: isDarkMode ? 'text-blue-400' : 'text-blue-600',
      error: isDarkMode ? 'text-red-400' : 'text-red-600'
    },
    button: {
      primary: {
        bg: isDarkMode ? 'bg-blue-600' : 'bg-blue-500',
        hover: isDarkMode ? 'hover:bg-blue-700' : 'hover:bg-blue-600',
        text: 'text-white',
        border: isDarkMode ? 'border-blue-600' : 'border-blue-500'
      }
    }
  }

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
    categoryId?: string
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
  // Cache full detail payload per tooling sub-process id for persistence on Save
  const [toolingDetailBySubProcessId, setToolingDetailBySubProcessId] = useState<Record<string, any>>({})

  // State untuk modal gambar part
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean
    imageUrl: string
    partName: string
  }>({
    isOpen: false,
    imageUrl: '',
    partName: ''
  })

  // Saving state for explicit Save button
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)



  // Effect untuk memastikan progressToolingDetailProgress ter-update dengan benar
  useEffect(() => {
    if (selectedPart) {
      // Prefetch: cari dan ambil nilai tooling detail dari backend agar overall langsung akurat
      const prefetchTooling = async () => {
        try {
          for (const category of selectedPart.progress) {
            for (const process of category.processes) {
              if (process.children && process.children.length > 0) {
                for (const child of process.children) {
                  if (child.name === "Progress Tooling") {
                    // Jika backend punya detail, gunakan itu untuk set progress lokal juga
                    if (
                      isValidUuid(selectedPart.id) &&
                      isValidUuid(category.id) &&
                      isValidUuid(process.id) &&
                      isValidUuid(child.id)
                    ) {
                      try {
                        const resp = await getProgressToolingDetail({
                          partId: selectedPart.id,
                          categoryId: category.id,
                          processId: child.id,
                          subProcessId: child.id
                        })
                        const overall = resp?.data?.overallProgress ?? resp?.overallProgress
                        if (typeof overall === 'number') {
                          setProgressToolingDetailProgress(Math.round(Math.max(0, Math.min(100, overall))))
                          setToolingDetailBySubProcessId(prev => ({ ...prev, [child.id]: { ...(prev[child.id] || {}), overallProgress: overall } }))
                        }
                      } catch (e) {
                        // Abaikan jika endpoint belum ada datanya
                      }
                    }
                  }
                }
              }
            }
          }
        } catch {}
      }
      prefetchTooling()

      // Cari Progress Tooling sub-process dan hitung progress detail
      let totalDetailProgress = 0;
      let foundProgressTooling = false;
      
      selectedPart.progress.forEach((category) => {
        category.processes.forEach((process) => {
          if (process.children && process.children.length > 0) {
            process.children.forEach((child) => {
              if (child.name === "Progress Tooling") {
                foundProgressTooling = true;
                // Prefill dari backend jika tersedia agar tidak reset ke 0
                const backendOverall = (child as any)?.toolingDetail?.overallProgress;
                if (typeof backendOverall === 'number') {
                  totalDetailProgress = backendOverall;
                }
              }
            });
          }
        });
      });
      
      // Jika tidak ada Progress Tooling, reset progress detail
      if (!foundProgressTooling) {
        setProgressToolingDetailProgress(0);
      } else {
        if (totalDetailProgress > 0) {
          setProgressToolingDetailProgress(Math.round(totalDetailProgress));
        }
      }
    }
  }, [selectedPart]);

  // Effect untuk memastikan progress bar tooling ter-update ketika progressToolingDetailProgress berubah
  useEffect(() => {
    // Force re-render untuk memastikan progress bar ter-update
  }, [progressToolingDetailProgress]);

  // Effect untuk testing isValidUuid function
  useEffect(() => {
    testIsValidUuid();
  }, []);

  // Effect untuk mengatur visibility sub-process berdasarkan showDetailedProcesses
  useEffect(() => {
    // The JSX will automatically handle the visibility based on showDetailedProcesses state
  }, [showDetailedProcesses, selectedPart]);

  // Helper: ambil nilai overall progress dari child "Progress Tooling" jika tersedia dari backend,
  // fallback ke state lokal jika belum ada
  const getToolingOverallFromChild = (child: Process): number => {
    const raw = (child as any)?.toolingDetail?.overallProgress
    if (typeof raw === 'number' && !isNaN(raw)) {
      const clamped = Math.max(0, Math.min(100, Number(raw)))
      return Math.round(clamped)
    }
    return progressToolingDetailProgress
  }

  // Fungsi untuk menghitung progress process dengan mempertimbangkan detail Progress Tooling
  // Logika: 
  // 1. Jika process sudah completed manual, return 100%
  // 2. Jika ada sub-process, hitung berdasarkan sub-process:
  //    - Progress Tooling menggunakan progress detail (0-100%)
  //    - Sub-process lain menggunakan status completed (0 atau 100%)
  // 3. Jika tidak ada sub-process, return 0%
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
          // Gunakan progress detail untuk Progress Tooling dari data backend bila ada
          totalProgress += getToolingOverallFromChild(child)
          totalWeight += 100 // Progress Tooling memiliki weight 100%
        } else {
          // Gunakan status completed untuk sub-process lain
          totalProgress += child.completed ? 100 : 0
          totalWeight += 100
        }
      })
      
      const result = totalWeight > 0 ? Math.round(totalProgress / totalWeight * 100) : 0
      return result
    }
    
    // Jika tidak ada sub-process dan process belum complete, return 0%
    return 0
  }

  // Fungsi untuk menghitung overall progress dengan mempertimbangkan detail Progress Tooling
  // Logika:
  // 1. Hitung semua unit (process + sub-process)
  // 2. Progress Tooling menggunakan progress detail (0-100%)
  // 3. Process/sub-process lain menggunakan status completed (0 atau 1)
  // 4. Return persentase keseluruhan
  const calculateOverallProgressWithDetail = (part: Part): number => {
    let totalUnits = 0
    let completedUnits = 0

    part.progress.forEach((category) => {
      category.processes.forEach((proc) => {
        if (proc.children && proc.children.length > 0) {
          // Jika ada sub-process, hitung berdasarkan sub-process
          proc.children.forEach((child) => {
            totalUnits += 1
            if (child.name === "Progress Tooling") {
              // Progress Tooling menggunakan progress detail dari backend bila ada
              completedUnits += (getToolingOverallFromChild(child) / 100)
            } else if (child.completed) {
              completedUnits += 1
            }
          })
        } else {
          // Jika tidak ada sub-process, hitung berdasarkan process langsung
          totalUnits += 1
          if (proc.completed) completedUnits += 1
        }
      })
    })

    return totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0
  }

  // Save all current progress state to backend (explicit save)
  // Logika:
  // 1. Collect semua update progress (process + sub-process)
  // 2. Progress Tooling completion status berdasarkan progress detail
  // 3. Kirim semua update ke backend secara batch
  // 4. Refresh data dari backend untuk memastikan konsistensi
  const saveAllProgressToBackend = async () => {
    if (!selectedPart) return
    setIsSaving(true)
    try {
      console.log('Starting to save all progress to backend...');
      console.log('Selected part before save:', selectedPart);
      
      const updates: Promise<any>[] = []
      const updateData: any[] = []
      
      let skippedNoId = 0
      const detailSaves: Promise<any>[] = []
      selectedPart.progress.forEach((category) => {
        console.log(`Processing category: ${category.name}`);
        category.processes.forEach((process) => {
          console.log(`Processing process: ${process.name}, completed: ${process.completed}`);
          
          // Hanya kirim ke backend jika ID valid (UUID dari DB)
          if (isValidUuid(process.id)) {
            updateData.push({
              processId: process.id,
              completed: !!process.completed,
              type: 'process'
            });
            updates.push(apiUpdateProcessCompletion(process.id, !!process.completed))
            // Persist detail parent (completed & notes)
            if (isValidUuid(selectedPart.id) && isValidUuid(category.id)) {
              detailSaves.push(
                updateProgressDetail({
                  partId: selectedPart.id,
                  categoryId: category.id,
                  processId: process.id
                }, {
                  completed: !!process.completed,
                  notes: process.notes || ''
                })
              )
            }
          } else {
            skippedNoId += 1
          }
          
          // Save children
          if (process.children && process.children.length > 0) {
            process.children.forEach((child) => {
              console.log(`Processing child: ${child.name}, completed: ${child.completed}`);
              if (child.name === 'Progress Tooling') {
                // Progress Tooling completion status berdasarkan progress detail
                const childCompleted = progressToolingDetailProgress === 100;
                console.log(`Progress Tooling child completed: ${childCompleted} (detail progress: ${progressToolingDetailProgress}%)`);
                
                if (isValidUuid(child.id)) {
                  updateData.push({
                    processId: child.id,
                    completed: childCompleted,
                    type: 'subprocess',
                    parentProcessId: process.id
                  });
                  updates.push(apiUpdateProcessCompletion(child.id, childCompleted))
                  // Persist granular tooling detail/progress additionally if available
                  if (isValidUuid(selectedPart.id) && isValidUuid(category.id) && isValidUuid(process.id)) {
                    const fullDetail = toolingDetailBySubProcessId[child.id] || { 
                      overallProgress: parseFloat(progressToolingDetailProgress.toString()),
                      designToolingCompleted: false,
                      machining1Completed: false,
                      machining2Completed: false,
                      machining3Completed: false,
                      assyCompleted: false,
                      approvalCompleted: false,
                      rawMaterialActual: null,
                      rawMaterialPlanned: null,
                      trialCount: 1,
                      trialsCompleted: []
                    }
                    console.log('Saving tooling detail for child:', child.id, fullDetail);
                    detailSaves.push(
                      apiUpdateProgressToolingDetail({
                        partId: selectedPart.id,
                        categoryId: category.id,
                        processId: child.id,
                        subProcessId: child.id
                      }, fullDetail)
                    )
                    // Simpan trial granular jika tersedia
                    if (Array.isArray((fullDetail as any).trials) && (fullDetail as any).trials.length > 0) {
                      console.log('Saving tooling trials:', (fullDetail as any).trials);
                      detailSaves.push(
                        upsertProgressToolingTrials({
                          partId: selectedPart.id,
                          categoryId: category.id,
                          processId: child.id
                        }, (fullDetail as any).trials)
                      )
                    }
                    detailSaves.push(
                      updateProgressDetail({
                        partId: selectedPart.id,
                        categoryId: category.id,
                        processId: process.id,
                        subProcessId: child.id
                      }, {
                        completed: childCompleted,
                        notes: child.notes || ''
                      })
                    )
                  }
                } else {
                  skippedNoId += 1
                }
              } else {
                if (isValidUuid(child.id)) {
                  updateData.push({
                    processId: child.id,
                    completed: !!child.completed,
                    type: 'subprocess',
                    parentProcessId: process.id
                  });
                  updates.push(apiUpdateProcessCompletion(child.id, !!child.completed))
                  if (isValidUuid(selectedPart.id) && isValidUuid(category.id) && isValidUuid(process.id)) {
                    detailSaves.push(
                      updateProgressDetail({
                        partId: selectedPart.id,
                        categoryId: category.id,
                        processId: process.id,
                        subProcessId: child.id
                      }, {
                        completed: !!child.completed,
                        notes: child.notes || ''
                      })
                    )
                  }
                } else {
                  skippedNoId += 1
                }
              }
            })
          }
        })
      })
      
      console.log('Update data to be sent:', updateData);
      console.log(`Sending ${updates.length} updates to backend...`);
      if (skippedNoId > 0) {
        console.warn(`Skipped ${skippedNoId} items without valid DB IDs (likely UI-only items).`)
      }
      
      const results = await Promise.allSettled(updates)
      // Pisahkan tooling detail vs generic progress detail agar error messaging akurat
      const toolingDetailPromises = detailSaves.filter(p =>
        // Heuristik: axios request path mengandung '/tooling-detail/'
        // Tidak ada akses langsung ke URL di sini, jadi kita tandai saat push (lihat di bawah)
        // Placeholder; akan ditimpa oleh metadata pada object Promise jika ada
        false
      )
      const detailResults = await Promise.allSettled(detailSaves)
      console.log('Backend update results:', results);
      console.log('Progress detail save results:', detailResults)
      
      // Check for any failed updates
      const failedUpdates = results.filter(result => result.status === 'rejected');
      const failedDetailUpdates = detailResults.filter(result => result.status === 'rejected');
      if (failedUpdates.length > 0) {
        console.error('Some updates failed:', failedUpdates);
        // Show error message to user
        alert('Beberapa update gagal disimpan. Silakan coba lagi.');
        return;
      }
      // Note: beberapa detail non-tooling mungkin gagal karena optional table, tapi tidak blocker.
      if (failedDetailUpdates.length > 0) {
        console.warn('Some progress detail updates failed (non-blocking):', failedDetailUpdates);
      }
      
      console.log('All updates completed, refreshing data from backend...');
      
      // Wait a bit for backend to process the updates
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Refresh data from backend to ensure consistency
      await refreshPartsData()
      
      setHasUnsavedChanges(false)
      console.log('Progress saved successfully!');
      
      // Show success message to user
      alert('Progress berhasil disimpan ke database!');
      
    } catch (error) {
      console.error('Gagal menyimpan progress ke backend:', error)
      alert('Gagal menyimpan progress. Silakan coba lagi.');
    } finally {
      setIsSaving(false)
    }
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
          // Update isi modal agar bukti tampil langsung di dalam modal
          setEvidenceModal(prev => ({ ...prev, evidence }));
          // Broadcast untuk komponen list di bawah judul
          window.dispatchEvent(new Event('evidence-updated'));
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

  // Load data from backend on mount (preload full detail for selected part if available)
  useEffect(() => {
    const fetchParts = async () => {
      try {
        console.log("ManageProgress: Starting to load data from backend")
        const response = await getAllParts()
        let partsArray = []
        if (Array.isArray(response.data)) {
          partsArray = response.data
        } else if (response.data && Array.isArray(response.data.data)) {
          partsArray = response.data.data
        }
        if (partsArray.length > 0) {
          let mappedParts = partsArray.map(mapBackendPartToFrontend)
          // Jika URL punya partId, ambil detail lengkap part tsb dari endpoint khusus
          if (partId) {
            try {
              const detailRes = await getPartWithProgress(partId)
              const detailData = detailRes?.data || detailRes?.data?.data || null
              if (detailData) {
                const detailed = mapBackendPartToFrontend(detailData)
                // Prefill Progress Tooling nilai overall dan trials agar overall langsung sesuai backend
                try {
                  for (const category of detailed.progress) {
                    for (const proc of category.processes) {
                      if (proc.children && proc.children.length > 0) {
                        for (const child of proc.children) {
                          if (child.name === 'Progress Tooling') {
                            const overall = (child as any)?.toolingDetail?.overallProgress
                            if (typeof overall === 'number') {
                              setProgressToolingDetailProgress(Math.round(Math.max(0, Math.min(100, overall))))
                              setToolingDetailBySubProcessId(prev => ({
                                ...prev,
                                [child.id]: { ...(prev[child.id] || {}), ...(child as any).toolingDetail }
                              }))
                            }
                            // Prefetch trials dari backend
                            if (isValidUuid(detailed.id) && isValidUuid(category.id) && isValidUuid(child.id)) {
                              try {
                                const trialRes = await getProgressToolingTrials({ partId: detailed.id, categoryId: category.id, processId: child.id })
                                const arr = trialRes?.data || trialRes?.trials || []
                                if (Array.isArray(arr) && arr.length > 0) {
                                  setToolingDetailBySubProcessId(prev => ({
                                    ...prev,
                                    [child.id]: { ...(prev[child.id] || {}), trials: arr.map((t: any) => ({
                                      index: t.index,
                                      name: t.name,
                                      completed: !!t.completed,
                                      weight: t.weight,
                                      notes: t.notes || null
                                    })) }
                                  }))
                                }
                              } catch {}
                            }
                          }
                        }
                      }
                    }
                  }
                } catch {}
                // Merge ke list
                mappedParts = mappedParts.map(p => p.id === detailed.id ? detailed : p)
              }
            } catch (e) {
              console.warn('getPartWithProgress failed, fallback to list data')
            }
          }
          setParts(mappedParts)
          saveToLocalStorage(mappedParts)
        } else {
          const localData = loadFromLocalStorage()
          if (localData) setParts(localData)
          else setParts([])
        }
      } catch (error: any) {
        console.error('Gagal memuat data parts dari backend:', error?.message)
        const localData = loadFromLocalStorage()
        if (localData) setParts(localData)
        else setParts([])
      }
    }
    fetchParts()
  }, [])

  // Prefetch evidence from backend with limited concurrency to avoid resource errors
  useEffect(() => {
    const prefetchAllEvidence = async () => {
      if (!selectedPart) return
      try {
        const tasks: Array<{categoryId: string; processId: string; subProcessId: string | null; targetId: string}> = []
        for (const category of selectedPart.progress) {
          for (const proc of category.processes) {
            if (isValidUuid(proc.id)) {
              tasks.push({ categoryId: category.id, processId: proc.id, subProcessId: null, targetId: proc.id })
            }
            if (proc.children && proc.children.length > 0) {
              for (const child of proc.children) {
                if (isValidUuid(child.id)) {
                  tasks.push({ categoryId: category.id, processId: proc.id, subProcessId: child.id, targetId: child.id })
                }
              }
            }
          }
        }

        // Batasi maksimal 5 request bersamaan
        const maxConcurrent = 5
        let index = 0
        const worker = async () => {
          while (index < tasks.length) {
            const current = tasks[index++]
            try {
              const res: any = await getProcessEvidence(current.targetId)
              const list = res?.data || res?.evidence || []
              if (Array.isArray(list) && list.length > 0) {
                handleEvidenceUpdate(selectedPart.id, current.categoryId, current.processId, current.subProcessId, list)
              }
            } catch {}
            // Small delay to yield UI thread
            await new Promise(r => setTimeout(r, 10))
          }
        }

        const workers = Array.from({ length: Math.min(maxConcurrent, tasks.length) }, () => worker())
        await Promise.all(workers)
      } catch {}
    }
    prefetchAllEvidence()
  }, [selectedPart])

  // Inline delete evidence handler (for both process & sub-process)
  const handleInlineDeleteEvidence = async (
    partId: string,
    categoryId: string,
    processId: string,
    subProcessId: string | null,
    evidenceId: string
  ) => {
    try {
      try { await deleteEvidence(evidenceId) } catch {}

      // Ambil list evidence saat ini dari state
      let currentList: Evidence[] = []
      const part = parts.find(p => p.id === partId)
      const category = part?.progress.find(c => c.id === categoryId)
      const proc = category?.processes.find(p => p.id === processId)
      if (subProcessId) {
        const child = proc?.children?.find(c => c.id === subProcessId)
        currentList = child?.evidence || []
        } else {
        currentList = proc?.evidence || []
        }

      const updated = currentList.filter(e => e.id !== evidenceId)
      handleEvidenceUpdate(partId, categoryId, processId, subProcessId, updated)
    } catch (error) {
      console.error('Error deleting evidence inline:', error)
      }
    }

  // Find selected part based on partId from URL
  useEffect(() => {
    console.log("ManageProgress: partId from URL:", partId)
    console.log("ManageProgress: parts loaded:", parts.length)
    
    if (partId && parts.length > 0) {
      const foundPart = parts.find(part => part.id === partId)
      console.log("ManageProgress: found part:", foundPart)
      if (foundPart) {
        setSelectedPart(foundPart)
      } else {
        // If part not found, redirect to dashboard
        console.log("ManageProgress: part not found, redirecting to dashboard")
        navigate('/progress')
      }
    } else if (partId && parts.length === 0) {
      console.log("ManageProgress: partId exists but no parts loaded")
    } else if (!partId) {
      console.log("ManageProgress: no partId in URL, redirecting to dashboard")
      navigate('/progress')
    }
  }, [partId, parts, navigate])

  // Function to refresh parts data from backend
  const refreshPartsData = async () => {
    try {
      console.log('Refreshing parts data from backend...');
      const response = await getAllParts()
      console.log('Backend response:', response);
      
      let partsArray = []
      if (Array.isArray(response.data)) {
        partsArray = response.data
      } else if (response.data && Array.isArray(response.data.data)) {
        partsArray = response.data.data
      }
      
      console.log('Parts array from backend:', partsArray);
      
      if (partsArray.length > 0) {
        const mappedParts = partsArray.map(mapBackendPartToFrontend)
        console.log('Mapped parts after refresh:', mappedParts);
        
        // Find the current selected part in the new data
        if (selectedPart) {
          const updatedSelectedPart = mappedParts.find(part => part.id === selectedPart.id)
          console.log('Current selected part:', selectedPart);
          console.log('Updated selected part from backend:', updatedSelectedPart);
          
          if (updatedSelectedPart) {
            // Update selected part dengan data dari backend
            setSelectedPart(updatedSelectedPart)
            
            // Update parts array juga
            setParts(mappedParts)
            
            // Reset unsaved changes karena data sudah sync dengan backend
            setHasUnsavedChanges(false)
            
            // Save to localStorage as backup
            saveToLocalStorage(mappedParts)
            
            console.log('Selected part updated with backend data');
          }
        } else {
          // Jika tidak ada selected part, update parts array saja
          setParts(mappedParts)
          
          // Save to localStorage as backup
          saveToLocalStorage(mappedParts)
        }
      } else {
        // Try to load from localStorage if backend has no data
        const localData = loadFromLocalStorage()
        if (localData) {
          console.log('Using data from localStorage as fallback after refresh')
          setParts(localData)
        } else {
          setParts([])
        }
      }
    } catch (error) {
      console.error('Gagal refresh data parts dari backend:', error)
      
      // Try to load from localStorage if backend fails
      const localData = loadFromLocalStorage()
      if (localData) {
        console.log('Using data from localStorage as fallback after refresh error')
        setParts(localData)
      }
    }
  }

  // Auto-update process completion when sub-processes change
  useEffect(() => {
    // Auto-checklist dinonaktifkan: tidak melakukan perubahan otomatis pada completed flag
  }, [selectedPart, parts])

  // Helper function untuk Progress Tooling yang hanya bisa auto-complete
  const isProgressToolingAutoCompleted = (process: Process): boolean => {
    // Auto checklist dinonaktifkan
    return false;
  }

  // Helper function to check if process was auto-completed
  const isProcessAutoCompleted = (process: Process): boolean => {
    // Auto checklist dinonaktifkan
    return false;
  }

  // Helper function to check and update process completion based on sub-processes
  const updateProcessCompletion = (process: Process): Process => {
    // Non-aktifkan auto-checklist: tidak pernah mengubah flag completed secara otomatis
    return process
  }

  // Toggle process completion
  // Logika:
  // 1. Progress Tooling tidak bisa di-toggle manual (hanya auto-complete)
  // 2. Update local state terlebih dahulu (optimistic update)
  // 3. Auto-save ke backend untuk persistence
  // 4. Mark sebagai having unsaved changes
  const toggleProcess = async (partId: string, progressId: string, processId: string, childId?: string) => {
    try {
      // Tentukan nilai completed baru yang akan dikirim ke backend (optimistic)
      let toggledCompleted = false
      let isProgressToolingChild = false
      let targetProcessId = processId
      
      if (selectedPart) {
        const category = selectedPart.progress.find(c => c.id === progressId)
        const proc = category?.processes.find(p => p.id === processId)
        if (childId && proc?.children) {
          const child = proc.children.find(c => c.id === childId)
          isProgressToolingChild = child?.name === 'Progress Tooling'
          toggledCompleted = !(child?.completed ?? false)
          targetProcessId = childId // Gunakan child ID untuk backend update
        } else {
          toggledCompleted = !(proc?.completed ?? false)
        }
      }

      // Jika Progress Tooling child, abaikan (tidak boleh manual)
      if (isProgressToolingChild) return

      console.log(`🔄 Toggling process: partId=${partId}, progressId=${progressId}, processId=${processId}, childId=${childId}`);
      console.log(`📝 New completed status: ${toggledCompleted}`);

      // Update local state first (optimistic update)
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
                      child.id === childId ? { ...child, completed: toggledCompleted } : child,
                    )
                    
                    // Check if all sub-processes are completed
                    const allChildrenCompleted = updatedChildren.length > 0 && updatedChildren.every(child => child.completed)
                    
                    console.log(`Sub-process ${childId} toggled to: ${toggledCompleted}`);
                    console.log(`All children completed: ${allChildrenCompleted}`);
                    
                    return {
                      ...process,
                      children: updatedChildren,
                      // Auto-complete process if all children are completed
                      completed: allChildrenCompleted
                    }
                  } else {
                    console.log(`Process ${processId} toggled to: ${toggledCompleted}`);
                    return { ...process, completed: toggledCompleted }
                  }
                }),
              }
            }),
          }
        })
        
        // Update selected part if it's the current part
        if (selectedPart && selectedPart.id === partId) {
          const updatedSelectedPart = updatedParts.find(part => part.id === partId)
          if (updatedSelectedPart) {
            console.log('Updating selected part with new completion status');
            setSelectedPart(updatedSelectedPart)
          }
        }
        
        setHasUnsavedChanges(true)
        console.log('Local state updated, marked as having unsaved changes');
        return updatedParts
      })
      
      // AUTO-SAVE: Langsung kirim ke backend untuk persistence
      console.log(`🔍 Checking if targetProcessId is valid: ${targetProcessId} (type: ${typeof targetProcessId})`);
      console.log(`🔍 isValidUuid result: ${isValidUuid(targetProcessId)}`);
      
      if (isValidUuid(targetProcessId)) {
        try {
          console.log(`💾 Auto-saving to backend for process ID: ${targetProcessId}`);
          console.log(`📤 Sending completion update: ${targetProcessId} -> ${toggledCompleted}`);
          
          // Update process completion di backend
          const updateResponse = await apiUpdateProcessCompletion(targetProcessId, toggledCompleted)
          console.log('✅ Backend update successful:', updateResponse)
          
          // Update overall progress di backend
          try {
            console.log(`📤 Sending process overall progress update: ${targetProcessId} -> ${toggledCompleted ? 100 : 0}%`);
            const overallProgressResponse = await updateProcessOverallProgress(targetProcessId, toggledCompleted ? 100 : 0)
            console.log('✅ Overall progress update successful:', overallProgressResponse)
          } catch (progressError) {
            console.warn('⚠️ Overall progress update failed:', progressError)
          }
          
          // Update part overall progress di backend
          if (isValidUuid(selectedPart?.id)) {
            try {
              const partOverallProgress = calculateOverallProgressWithDetail(selectedPart)
              console.log(`📤 Sending part overall progress update: ${selectedPart.id} -> ${partOverallProgress}%`);
              const partProgressResponse = await updatePartOverallProgress(selectedPart.id, partOverallProgress)
              console.log('✅ Part overall progress update successful:', partProgressResponse)
            } catch (partError) {
              console.warn('⚠️ Part overall progress update failed:', partError)
            }
          }
          
          console.log('🎯 Auto-save completed successfully')
          
        } catch (backendError) {
          console.error('❌ Auto-save failed:', backendError)
          console.error('❌ Error details:', {
            message: backendError.message,
            stack: backendError.stack,
            name: backendError.name
          })
          
          // Revert local state if backend update fails
          console.log('🔄 Reverting local state due to backend failure')
          await refreshPartsData()
          return
        }
      } else {
        console.warn(`⚠️ targetProcessId tidak valid: ${targetProcessId} (type: ${typeof targetProcessId})`)
        console.warn('❌ Auto-save tidak dapat dijalankan karena ID tidak valid')
      }
      
      console.log("✅ Status complete berhasil diubah dan tersimpan ke database")
    } catch (error) {
      console.error("❌ Error saat mengubah status complete:", error)
      // Refresh data to revert any incorrect changes
      refreshPartsData()
    }
  }

  // Handle process form save
  const handleProcessSave = async (processData: { name: string; notes?: string; completed: boolean }) => {
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
      
      // Update selected part if it's the current part
      if (selectedPart && selectedPart.id === partId) {
        const updatedSelectedPart = updatedParts.find(part => part.id === partId);
        if (updatedSelectedPart) {
          setSelectedPart(updatedSelectedPart);
        }
      }
      
      // Mark as having unsaved changes
      setHasUnsavedChanges(true);
      
      console.log("Data process berhasil disimpan secara lokal. Gunakan tombol Save untuk menyimpan ke backend.");
    } catch (error) {
      console.error("Error saat menyimpan process:", error);
    }
  }

  // Handle part form save
  const handlePartSave = async (partData: { partName: string; partNumber: string; customer: string; partImage?: File }) => {
    const { partId, type } = partModal

    try {
      if (type === "edit" && partId) {
        // Update existing part via backend API with image upload
        await updatePart(partId, partData);
        console.log("Data part berhasil diupdate via backend");
      } else {
        // For add, we'll redirect to dashboard since this page is for managing existing parts
        console.log("Add new part should be done from dashboard");
        navigate('/progress');
        return;
      }
      
      // Refresh data from backend
      await refreshPartsData();
      
      console.log("Data part berhasil disimpan dan di-refresh dari backend");
    } catch (error) {
      console.error("Error saat menyimpan part:", error);
    }
  }

  // Handle delete confirmation
  const handleDelete = async () => {
    const { type, partId, categoryId, processId, subProcessId } = deleteDialog

    try {
      if (type === "part" && partId) {
        // Delete part via backend API
        await deletePart(partId);
        console.log("Part berhasil dihapus dari backend");
        setSelectedPart(null);
        navigate('/progress');
      } else if (type === "process" && partId && categoryId && processId) {
        // For now, we'll just refresh data since process deletion API might not be implemented
        console.log("Process deletion via API not implemented yet");
        await refreshPartsData();
      } else if (type === "subprocess" && partId && categoryId && processId && subProcessId) {
        // For now, we'll just refresh data since subprocess deletion API might not be implemented
        console.log("Subprocess deletion via API not implemented yet");
        await refreshPartsData();
      } else {
        console.error("Missing required parameters for deletion")
        return
      }

      console.log("Data berhasil dihapus dan di-refresh dari backend");
    } catch (error) {
      console.error("Error saat menghapus data:", error);
      // Refresh data to ensure consistency
      await refreshPartsData();
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

  // Function to save data to localStorage as backup
  const saveToLocalStorage = (partsData: Part[]) => {
    try {
      const partsDataString = JSON.stringify(partsData)
      localStorage.setItem("parts-data", partsDataString)
      sessionStorage.setItem("parts-data-backup", partsDataString)
      console.log("Data saved to localStorage and sessionStorage as backup")
    } catch (error) {
      console.error("Error saving to localStorage:", error)
    }
  }

  // Function to load data from localStorage as fallback
  const loadFromLocalStorage = (): Part[] | null => {
    try {
      const partsDataString = localStorage.getItem("parts-data")
      if (partsDataString) {
        const partsData = JSON.parse(partsDataString)
        console.log("Data loaded from localStorage as fallback")
        return partsData
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error)
    }
    return null
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
        <ManageProgressHeader
          showDetailedProcesses={showDetailedProcesses}
          onToggleDetailedProcesses={() => setShowDetailedProcesses(!showDetailedProcesses)}
        />

        {/* Parts List */}
        <div className="space-y-6 sm:space-y-8">
          {selectedPart ? (
            <div className="space-y-6">
              {/* Progress Overview Card */}
              <ProgressOverviewCard
                part={selectedPart}
                onEditPart={() => setPartModal({
                  isOpen: true,
                  type: "edit",
                  partId: selectedPart.id,
                  part: selectedPart,
                })}
                onDeletePart={() => setDeleteDialog({
                  isOpen: true,
                  type: "part",
                  partId: selectedPart.id,
                  name: selectedPart.partName,
                })}
                onViewImage={() => setImageModal({
                  isOpen: true,
                  imageUrl: selectedPart.partImageUrl || '',
                  partName: selectedPart.partName
                })}
                calculateOverallProgress={calculateOverallProgressWithDetail}
                saveButton={
                  <SaveButton
                    onClick={saveAllProgressToBackend}
                    isSaving={isSaving}
                    hasUnsavedChanges={hasUnsavedChanges}
                  />
                }
              />

              {/* View Details Button - Full width below overview card */}
              <div className="w-full">
                <Button
                  onClick={() => {
                    setShowDetailedProcesses(!showDetailedProcesses);
                    if (!showDetailedProcesses) {
                      setTimeout(() => {
                        const detailedSection = document.querySelector('[data-section="detailed-processes"]');
                        if (detailedSection) detailedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }
                  }}
                  size="sm"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white border-transparent shadow-md hover:shadow-lg transition-all duration-200 py-5"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span className="hidden sm:inline">
                    {showDetailedProcesses ? "Hide Details" : "View Details"}
                  </span>
                  <span className="sm:hidden">
                    {showDetailedProcesses ? "Hide" : "View"}
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

              {/* Detailed process section */}
              {showDetailedProcesses && (
                <div className="space-y-4 sm:space-y-6" data-section="detailed-processes">
                  {selectedPart.progress.map((progressCategory) => {
                    return (
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

                                  {/* Process Action Buttons */}
                                  <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <Button size="sm" onClick={() => setProcessModal({
                                      isOpen: true,
                                      type: "edit",
                                      isSubProcess: false,
                                      partId: selectedPart.id,
                                      categoryId: progressCategory.id,
                                      processId: process.id,
                                      process: process,
                                    })} className="bg-blue-500 hover:bg-blue-600 text-white border-transparent text-xs px-3 py-1 h-8 shadow-sm hover:shadow-md transition-all duration-200">
                                      <Edit className="w-3 h-3 mr-1" />
                                      <span className="hidden sm:inline">Edit</span>
                                    </Button>
                                    
                                    <Button size="sm" onClick={() => setEvidenceModalWithCallback({
                                      isOpen: true,
                                      processId: process.id,
                                      processName: process.name,
                                      evidence: process.evidence || [],
                                      categoryId: progressCategory.id,
                                    })} className="bg-green-500 hover:bg-green-600 text-white border-transparent text-xs px-3 py-1 h-8 shadow-sm hover:shadow-md transition-all duration-200">
                                      <Upload className="w-3 h-3 mr-1" />
                                      <span className="hidden sm:inline">Evidence ({process.evidence?.length || 0})</span>
                                    </Button>
                                    
                                    <Button size="sm" onClick={() => setDeleteDialog({
                                      isOpen: true,
                                      type: "process",
                                      partId: selectedPart.id,
                                      categoryId: progressCategory.id,
                                      processId: process.id,
                                      name: process.name,
                                    })} className="bg-red-500 hover:bg-red-600 text-white border-transparent text-xs px-3 py-1 h-8 shadow-sm hover:shadow-md transition-all duration-200">
                                      <Trash2 className="w-3 h-3 mr-1" />
                                      <span className="hidden sm:inline">Delete</span>
                                    </Button>
                                  </div>

                                  {/* Add Sub-Process Button - Show prominently if no sub-processes exist */}
                                  {(!process.children || process.children.length === 0) && (
                                    <div className="mb-3">
                                      <Button 
                                        size="sm" 
                                        onClick={() => setProcessModal({
                                          isOpen: true,
                                          type: "add",
                                          isSubProcess: true,
                                          partId: selectedPart.id,
                                          categoryId: progressCategory.id,
                                          processId: process.id,
                                        })} 
                                        className="w-full bg-purple-500 hover:bg-purple-600 text-white border-transparent text-sm py-2 shadow-md hover:shadow-lg transition-all duration-200"
                                      >
                                        <Plus className="w-4 h-4 mr-2" />
                                        <span>Add Sub-Process to "{process.name}"</span>
                                      </Button>
                                    </div>
                                  )}

                                  {process.children && process.children.length > 0 && (
                                    <div className="mt-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <Button variant="outline" size="sm" className={`justify-between ${uiColors.bg.tertiary} ${uiColors.border.secondary} ${uiColors.text.secondary} hover:${uiColors.bg.secondary} cursor-default`}>
                                          <span className="text-sm">Sub-Processes ({process.children.length})</span>
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          onClick={() => setProcessModal({
                                            isOpen: true,
                                            type: "add",
                                            isSubProcess: true,
                                            partId: selectedPart.id,
                                            categoryId: progressCategory.id,
                                            processId: process.id,
                                          })} 
                                          className="bg-purple-500 hover:bg-purple-600 text-white border-transparent text-xs px-3 py-1 h-7 shadow-sm hover:shadow-md transition-all duration-200"
                                        >
                                          <Plus className="w-3 h-3 mr-1" />
                                          <span>Add More</span>
                                        </Button>
                                      </div>
                                      <div className={`mt-2 space-y-2 ${showDetailedProcesses ? '' : 'hidden'}`}>
                                        {process.children.map((child) => (
                                          <div key={child.id} className={`flex flex-col p-2 ${uiColors.bg.card} rounded border ${uiColors.border.tertiary} gap-2`}>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                                <Checkbox
                                                  id={`${selectedPart.id}-${progressCategory.id}-${process.id}-${child.id}`}
                                                  checked={child.name === "Progress Tooling" ? getToolingOverallFromChild(child) === 100 : child.completed}
                                                  onCheckedChange={() => {
                                                    if (child.name === "Progress Tooling") return;
                                                    toggleProcess(selectedPart.id, progressCategory.id, process.id, child.id);
                                                  }}
                                                  className={uiColors.border.tertiary}
                                                  disabled={child.name === "Progress Tooling"}
                                                />
                                                <label htmlFor={`${selectedPart.id}-${progressCategory.id}-${process.id}-${child.id}`} className={`text-sm ${uiColors.text.secondary}`}>
                                                  {child.name}
                                                </label>
                                              </div>
                                              <div className="flex flex-wrap items-center gap-1 w-full sm:w-auto">
                                                <Button size="sm" onClick={() => setProcessModal({
                                                  isOpen: true,
                                                  type: "edit",
                                                  isSubProcess: true,
                                                  partId: selectedPart.id,
                                                  categoryId: progressCategory.id,
                                                  processId: process.id,
                                                  subProcessId: child.id,
                                                  process: child,
                                                })} className="bg-blue-500 hover:bg-blue-600 text-white border-transparent text-xs px-2 py-1 h-7 shadow-sm hover:shadow-md transition-all duration-200">
                                                  <Edit className="w-3 h-3 mr-1" />
                                                  <span className="hidden sm:inline">Edit</span>
                                                </Button>
                                                <Button size="sm" onClick={() => setEvidenceModalWithCallback({
                                                  isOpen: true,
                                                  processId: process.id,
                                                  subProcessId: child.id,
                                                  processName: child.name,
                                                  evidence: child.evidence || [],
                                                  categoryId: progressCategory.id,
                                                })} className="bg-green-500 hover:bg-green-600 text-white border-transparent text-xs px-2 py-1 h-7 shadow-sm hover:shadow-md transition-all duration-200">
                                                  <Upload className="w-3 h-3 mr-1" />
                                                  <span className="hidden sm:inline">Evidence ({child.evidence?.length || 0})</span>
                                                </Button>
                                                <Button size="sm" onClick={() => setDeleteDialog({
                                                  isOpen: true,
                                                  type: "subprocess",
                                                  partId: selectedPart.id,
                                                  categoryId: progressCategory.id,
                                                  processId: process.id,
                                                  subProcessId: child.id,
                                                  name: child.name,
                                                })} className="bg-red-500 hover:bg-red-600 text-white border-transparent text-xs px-2 py-1 h-7 shadow-sm hover:shadow-md transition-all duration-200">
                                                  <Trash2 className="w-3 h-3 mr-1" />
                                                  <span className="hidden sm:inline">Delete</span>
                                                </Button>
                                              </div>
                                            </div>
                                            
                                            {/* Progress Tooling Detail Table */}
                                            {child.name === "Progress Tooling" && (
                                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                <ProgressToolingDropdown
                                                  progressToolingChild={child}
                                                  partId={selectedPart.id}
                                                  categoryId={progressCategory.id}
                                                  processId={process.id}
                                                  subProcessId={child.id}
                                                  onProgressUpdate={(progress) => {
                                                    setProgressToolingDetailProgress(progress)
                                                    setHasUnsavedChanges(true)
                                                  }}
                                                  onDetailChange={(detail) => {
                                                    console.log('Received detail from ProgressToolingDropdown:', detail);
                                                    setToolingDetailBySubProcessId(prev => ({
                                                      ...prev,
                                                      [child.id]: detail
                                                    }))
                                                    setHasUnsavedChanges(true)
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
                    )
                  })}
                </div>
              )}


            </div>
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
        processId={evidenceModal.processId}
        subProcessId={evidenceModal.subProcessId}
        partId={selectedPart?.id}
        categoryId={evidenceModal.categoryId}
      />

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={() => setImageModal({ ...imageModal, isOpen: false })}
        imageUrl={imageModal.imageUrl}
        partName={imageModal.partName}
      />
    </div>
  );
}



