"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/card";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/dialog";
import { useAuth } from "../../../main_view/contexts/AuthContext";
import { getProgressColor } from "../../const/colors";

// Helper function to generate unique IDs
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};
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
  Plus,
  Image,
  Settings,
} from "lucide-react";

// Types and Interfaces
interface Evidence {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string;
  uploadedAt: string;
  size?: number;
}

interface Process {
  id: string;
  name: string;
  completed: boolean;
  notes?: string;
  children?: Process[];
  evidence?: Evidence[];
}

interface ProgressCategory {
  id: string;
  name: string;
  processes: Process[];
}

interface Part {
  id: string;
  partName: string;
  partNumber: string;
  customer: string;
  partImage?: string; // URL gambar part
  progress: ProgressCategory[];
  createdAt: string;
  status: 'active' | 'completed' | 'on-hold';
}

// Add Part Modal Component
interface AddPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPart: (part: Omit<Part, 'id' | 'createdAt' | 'progress' | 'status'> & { status: 'active' }) => void;
}

function AddPartModal({ isOpen, onClose, onAddPart }: AddPartModalProps) {
  const [formData, setFormData] = useState({
    partName: '',
    partNumber: '',
    customer: '',
    partImage: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.partName && formData.partNumber && formData.customer) {
      onAddPart({
        partName: formData.partName,
        partNumber: formData.partNumber,
        customer: formData.customer,
        partImage: formData.partImage || undefined,
        status: 'active',
      });
      setFormData({ partName: '', partNumber: '', customer: '', partImage: '' });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] sm:w-auto bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 text-white mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            Add New Part
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Part Name *
            </label>
            <input
              type="text"
              value={formData.partName}
              onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
              placeholder="Enter part name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Part Number *
            </label>
            <input
              type="text"
              value={formData.partNumber}
              onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
              placeholder="Enter part number"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Customer *
            </label>
            <input
              type="text"
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
              placeholder="Enter customer name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Part Image URL (Optional)
            </label>
            <input
              type="url"
              value={formData.partImage}
              onChange={(e) => setFormData({ ...formData, partImage: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
              placeholder="Enter image URL"
            />
          </div>
          
          <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm sm:text-base"
            >
              Add Part
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const [parts, setParts] = useState<Part[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  // Load data from localStorage on mount and listen for changes
  useEffect(() => {
    const loadPartsData = () => {
      try {
        let savedParts;
        try {
          savedParts = localStorage.getItem("parts-data")
        } catch (localStorageError) {
          console.error("Dashboard: Error mengakses localStorage:", localStorageError)
          savedParts = null;
        }
        
        if (savedParts && savedParts !== "undefined" && savedParts !== "null") {
          try {
            const parsedData = JSON.parse(savedParts)
            setParts(parsedData)
            console.log("Dashboard: Data berhasil dimuat dari localStorage")
            return
          } catch (parseError) {
            console.error("Dashboard: Error parsing data dari localStorage:", parseError)
          }
        }
        
        let backupData;
        try {
          backupData = sessionStorage.getItem("parts-data-backup")
        } catch (sessionStorageError) {
          console.error("Dashboard: Error mengakses sessionStorage:", sessionStorageError)
          backupData = null;
        }
        
        if (backupData && backupData !== "undefined" && backupData !== "null") {
          try {
            const parsedBackupData = JSON.parse(backupData)
            setParts(parsedBackupData)
            console.log("Dashboard: Data berhasil dimuat dari sessionStorage (backup)")
            
            try {
              localStorage.setItem("parts-data", backupData)
            } catch (saveError) {
              console.error("Dashboard: Error menyimpan data ke localStorage:", saveError)
            }
          } catch (parseBackupError) {
            console.error("Dashboard: Error parsing data dari sessionStorage:", parseBackupError)
          }
        }
      } catch (error) {
        console.error("Dashboard: Error memuat data dari storage:", error)
      }
    }
    
    loadPartsData()
    
    const handleStorageChange = (e: StorageEvent | Event | null) => {
      if (!e || (e as StorageEvent).key === "parts-data" || (e as StorageEvent).key === "parts-data-backup") {
        loadPartsData()
      }
      
      if (e && (e as StorageEvent).key === "parts-data" && (e as StorageEvent).newValue) {
        try {
          sessionStorage.setItem("parts-data-backup", (e as StorageEvent).newValue)
          console.log("Dashboard: Data dari localStorage disinkronkan ke sessionStorage")
        } catch (sessionStorageError) {
          console.error("Dashboard: Error menyimpan ke sessionStorage saat sinkronisasi:", sessionStorageError)
        }
      }
    }
    
    window.addEventListener("parts-updated", handleStorageChange)
    window.addEventListener("storage", handleStorageChange)
    
    return () => {
      window.removeEventListener("parts-updated", handleStorageChange)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, []);

  // Add new part
  const handleAddPart = (partData: Omit<Part, 'id' | 'createdAt' | 'progress' | 'status'> & { status: 'active' }) => {
    const newPart: Part = {
      id: generateId(),
      ...partData,
      createdAt: new Date().toISOString(),
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
    };

    const updatedParts = [...parts, newPart];
    setParts(updatedParts);

    // Save to localStorage
    try {
      const partsDataString = JSON.stringify(updatedParts);
      localStorage.setItem("parts-data", partsDataString);
      sessionStorage.setItem("parts-data-backup", partsDataString);
      window.dispatchEvent(new Event("parts-updated"));
      console.log("Dashboard: Part baru berhasil ditambahkan");
    } catch (error) {
      console.error("Dashboard: Error menyimpan part baru:", error);
    }
  };

  // Calculate overall progress for a part
  const calculateOverallProgress = (part: Part): number => {
    if (part.progress.length === 0) return 0;
    
    let totalTasks = 0;
    let completedTasks = 0;

    part.progress.forEach((category) => {
      category.processes.forEach((process) => {
        if (process.children && process.children.length > 0) {
          process.children.forEach((child) => {
            totalTasks++;
            if (child.completed) completedTasks++;
          });
        } else {
          totalTasks++;
          if (process.completed) completedTasks++;
        }
      });
    });

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  // Get status info
  const getStatusInfo = (progress: number) => {
    if (progress === 100)
      return {
        color: "from-green-500 to-emerald-600",
        text: "Completed",
        icon: CheckCircle2,
        textColor: "text-green-400",
      };
    if (progress >= 75)
      return {
        color: "from-blue-500 to-cyan-600",
        text: "Near Completion",
        icon: Target,
        textColor: "text-blue-400",
      };
    if (progress >= 50)
      return {
        color: "from-yellow-500 to-orange-500",
        text: "In Progress",
        icon: Activity,
        textColor: "text-yellow-400",
      };
    if (progress >= 25)
      return {
        color: "from-purple-500 to-pink-500",
        text: "Started",
        icon: Zap,
        textColor: "text-purple-400",
      };
    return {
      color: "from-gray-500 to-gray-600",
      text: "Not Started",
      icon: Clock,
      textColor: "text-gray-400",
    };
  };

  // Filter parts based on search query
  const filteredParts = parts.filter(part => {
    if (!part || !searchQuery) return true;
    
    try {
      const query = searchQuery.toLowerCase();
      return (
        (part.partName && part.partName.toLowerCase().includes(query)) ||
        (part.partNumber && part.partNumber.toLowerCase().includes(query)) ||
        (part.customer && part.customer.toLowerCase().includes(query)) ||
        (part.status && part.status.toLowerCase().includes(query))
      );
    } catch (error) {
      console.error("Error filtering parts:", error);
      return true; // Show all parts if there's an error
    }
  });

  // Debug logging
  console.log("Dashboard render - parts:", parts.length, "searchQuery:", searchQuery, "filteredParts:", filteredParts.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header/Navigation Bar */}
      <header className="border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/tools">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">← Kembali</span>
                  <span className="sm:hidden">←</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Progress Tracker
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Project To-Do List Manager
                  </p>
                </div>
              </div>
            </div>

            {/* User Info and Logout */}
            {user && (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:flex items-center gap-2 bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700/50">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">
                    {user.nama || user.username}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                  onClick={() => handleLogout()}
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Out</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-10 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with title and add button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              <span className="hidden sm:inline">Engineering Project List</span>
              <span className="sm:hidden">Project List</span>
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              {/* Search Box */}
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery || ''}
                  onChange={(e) => {
                    try {
                      const value = e.target.value || '';
                      setSearchQuery(value);
                    } catch (error) {
                      console.error("Error setting search query:", error);
                      setSearchQuery('');
                    }
                  }}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm sm:text-base transition-all duration-300 hover:border-gray-500"
                  placeholder="Search parts, numbers, customers..."
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      try {
                        setSearchQuery('');
                      } catch (error) {
                        console.error("Error clearing search query:", error);
                        setSearchQuery('');
                      }
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors duration-200"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Add New Part Button */}
              <Button 
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add New Part</span>
                <span className="sm:hidden">Add Part</span>
              </Button>
            </div>
          </div>

          {/* Search Results Info */}
          {searchQuery && (
            <div className="mb-4 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">
                  Showing {filteredParts.length} of {parts.length} parts
                </span>
                <span className="text-gray-400">
                  Search: "{searchQuery}"
                </span>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-400 mb-1">
                  {parts.length}
                </div>
                <div className="text-xs sm:text-sm text-blue-300">Total Parts</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-400 mb-1">
                  {parts.filter(part => calculateOverallProgress(part) === 100).length}
                </div>
                <div className="text-xs sm:text-sm text-green-300">Completed</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-yellow-400 mb-1">
                  {parts.filter(part => calculateOverallProgress(part) > 0 && calculateOverallProgress(part) < 100).length}
                </div>
                <div className="text-xs sm:text-sm text-yellow-300">In Progress</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-400 mb-1">
                  {parts.filter(part => calculateOverallProgress(part) === 0).length}
                </div>
                <div className="text-xs sm:text-sm text-gray-300">Not Started</div>
              </CardContent>
            </Card>
          </div>

          {/* Parts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredParts.map((part, index) => {
              try {
                const overallProgress = calculateOverallProgress(part);
                const statusInfo = getStatusInfo(overallProgress);
                const StatusIcon = statusInfo.icon;

                return (
                  <Card
                    key={part.id}
                    className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-500 hover:shadow-2xl group animate-fade-in hover:bg-gray-750 hover:scale-[1.02] hover:border-blue-500/30 hover:shadow-blue-500/10 hover:shadow-purple-500/10 hover:shadow-cyan-500/10 hover:shadow-white/5 hover:shadow-yellow-500/10 hover:shadow-green-500/10 sm:hover:scale-[1.02]"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-base sm:text-lg text-white font-bold line-clamp-1">
                                {part.partName}
                              </CardTitle>
                              <p className="text-xs sm:text-sm text-gray-400 truncate">{part.partNumber}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                            <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-500 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs">
                              {part.customer}
                            </Badge>
                            <Badge
                              className={`bg-gradient-to-r ${statusInfo.color} text-white border-0 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs flex items-center gap-1`}
                            >
                              <StatusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              <span className="hidden sm:inline">{statusInfo.text}</span>
                              <span className="sm:hidden">{statusInfo.text.length > 8 ? statusInfo.text.substring(0, 8) + '...' : statusInfo.text}</span>
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Part Image */}
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {part.partImage ? (
                            <img 
                              src={part.partImage} 
                              alt={part.partName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex');
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full flex items-center justify-center text-gray-400" style={{ display: part.partImage ? 'none' : 'flex' }}>
                            <Image className="w-4 h-4 sm:w-6 sm:h-6" />
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 sm:space-y-6">
                      {/* Enhanced Progress Indicator */}
                      <div className="relative group">
                        {/* Progress Header */}
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:rotate-12">
                              <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white group-hover:animate-pulse" />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-gray-300 group-hover:text-white transition-colors duration-300 group-hover:font-bold">Progress</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-base sm:text-lg font-bold text-white group-hover:text-blue-300 transition-colors duration-300 group-hover:scale-110 transform">{overallProgress}%</span>
                            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${overallProgress === 100 ? 'bg-green-400' : overallProgress >= 75 ? 'bg-blue-400' : overallProgress >= 50 ? 'bg-yellow-400' : overallProgress >= 25 ? 'bg-purple-400' : 'bg-gray-400'} animate-pulse group-hover:scale-125 transition-transform duration-300 group-hover:animate-bounce`}></div>
                          </div>
                        </div>

                        {/* Enhanced Progress Bar */}
                        <div className="relative group/progress">
                          {/* Background Track */}
                          <div className={`h-2.5 sm:h-3 bg-gray-700 rounded-full overflow-hidden shadow-inner transition-all duration-300 group-hover/progress:shadow-lg group-hover/progress:shadow-blue-500/20 group-hover/progress:shadow-purple-500/20 group-hover/progress:shadow-cyan-500/20 group-hover/progress:shadow-white/10 group-hover/progress:shadow-yellow-500/20 group-hover/progress:shadow-green-500/20 ${
                            overallProgress === 100 ? 'progress-complete' : 
                            overallProgress >= 75 ? 'progress-bar-glow' : 
                            overallProgress >= 50 ? 'progress-warning' : 
                            overallProgress >= 25 ? 'progress-bar-glow' : ''
                          }`}>
                            {/* Animated Progress Fill */}
                            <div
                              className={`h-full bg-gradient-to-r ${statusInfo.color} transition-all duration-1500 ease-out rounded-full relative overflow-hidden animate-progress-fill group-hover:animate-progress-bounce ${overallProgress === 0 ? 'skeleton-loading' : ''} group-hover/progress:shadow-inner group-hover/progress:shadow-white/20 group-hover/progress:shadow-purple-500/20 group-hover/progress:shadow-cyan-500/20 group-hover/progress:shadow-white/10 group-hover/progress:shadow-yellow-500/20 group-hover/progress:shadow-green-500/20`}
                              style={{ 
                                width: `${overallProgress}%`,
                                '--progress-width': `${overallProgress}%`
                              } as React.CSSProperties}
                            >
                              {/* Shimmer Effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer group-hover/progress:via-white/30 group-hover/progress:animate-pulse group-hover/progress:shadow-sm group-hover/progress:shadow-purple-500/20 group-hover/progress:shadow-cyan-500/20 group-hover/progress:shadow-white/10 group-hover/progress:shadow-yellow-500/20 group-hover/progress:shadow-green-500/20"></div>
                              
                              {/* Progress Glow */}
                              <div className={`absolute inset-0 bg-gradient-to-r ${statusInfo.color} blur-sm opacity-50 animate-pulse-glow group-hover/progress:opacity-75 group-hover/progress:blur-md group-hover/progress:shadow-lg group-hover/progress:shadow-purple-500/30 group-hover/progress:shadow-cyan-500/30 group-hover/progress:shadow-white/20 group-hover/progress:shadow-yellow-500/30 group-hover/progress:shadow-green-500/30`}></div>
                              
                              {/* Progress Particles */}
                              {overallProgress > 0 && (
                                <div className="absolute inset-0">
                                  {[...Array(3)].map((_, i) => (
                                    <div
                                      key={i}
                                      className="absolute w-1 h-1 bg-white rounded-full animate-pulse group-hover/progress:scale-150 group-hover/progress:bg-yellow-300 group-hover/progress:shadow-sm group-hover/progress:shadow-yellow-500/50 group-hover/progress:shadow-cyan-500/50 group-hover/progress:shadow-white/30 group-hover/progress:shadow-purple-500/50 group-hover/progress:shadow-green-500/50"
                                      style={{
                                        left: `${Math.random() * 100}%`,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        animationDelay: `${i * 0.5}s`,
                                        animationDuration: '2s'
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                              
                              {/* Confetti for 100% progress */}
                              {overallProgress === 100 && (
                                <div className="absolute inset-0 pointer-events-none">
                                  {[...Array(5)].map((_, i) => (
                                    <div
                                      key={i}
                                      className={`absolute w-2 h-2 confetti group-hover/progress:scale-150 group-hover/progress:animate-bounce group-hover/progress:shadow-sm group-hover/progress:shadow-purple-500/50 group-hover/progress:shadow-cyan-500/50 group-hover/progress:shadow-white/30 group-hover/progress:shadow-yellow-500/50 group-hover/progress:shadow-green-500/50`}
                                      style={{
                                        left: `${Math.random() * 100}%`,
                                        top: '0%',
                                        backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][i % 5],
                                        animationDelay: `${i * 0.2}s`
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                        {/* Progress Markers */}
                        <div className="absolute inset-0 flex justify-between items-center px-0.5 sm:px-1 pointer-events-none">
                          {[0, 25, 50, 75, 100].map((marker) => (
                            <div
                              key={marker}
                              className={`w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full ${
                                overallProgress >= marker ? 'bg-white' : 'bg-gray-500'
                              } transition-all duration-300 group-hover:scale-150 group-hover:shadow-sm group-hover:shadow-white/50 group-hover:shadow-purple-500/30 group-hover:shadow-cyan-500/30 group-hover:shadow-white/20 group-hover:shadow-yellow-500/30 group-hover:shadow-green-500/30`}
                            ></div>
                          ))}
                        </div>

                        {/* Progress Label */}
                        <div className="mt-2 text-center">
                          <span className={`text-xs font-medium ${statusInfo.textColor} bg-gradient-to-r from-gray-800/80 to-gray-700/80 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full group-hover:from-blue-600/30 group-hover:to-blue-500/30 transition-all duration-300 group-hover:scale-105 transform hover:shadow-md hover:shadow-blue-500/25 hover:shadow-purple-500/25 hover:shadow-cyan-500/25 hover:shadow-white/10 hover:shadow-yellow-500/25`}>
                            {statusInfo.text}
                          </span>
                        </div>
                      </div>

                      {/* Progress Stats */}
                      <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                        <div className="bg-gradient-to-br from-gray-700/50 to-gray-600/50 rounded-lg p-1.5 sm:p-2 hover:from-blue-600/30 hover:to-blue-500/30 transition-all duration-300 group-hover:scale-105 transform hover:shadow-lg hover:shadow-blue-500/25 hover:shadow-purple-500/25 hover:shadow-cyan-500/25 hover:shadow-white/10 hover:shadow-yellow-500/25 hover:shadow-green-500/25">
                          <div className="text-xs text-gray-400 group-hover:text-blue-200 transition-colors duration-300">Tasks</div>
                          <div className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-300 transition-colors duration-300">
                            {part.progress.reduce((total, category) => 
                              total + category.processes.reduce((catTotal, process) => 
                                catTotal + (process.children?.length || 1), 0
                              ), 0
                            )}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-700/50 to-gray-600/50 rounded-lg p-1.5 sm:p-2 hover:from-green-600/30 hover:to-green-500/30 transition-all duration-300 group-hover:scale-105 transform hover:shadow-lg hover:shadow-green-500/25 hover:shadow-purple-500/25 hover:shadow-cyan-500/25 hover:shadow-white/10 hover:shadow-yellow-500/25 hover:shadow-green-500/25">
                          <div className="text-xs text-gray-400 group-hover:text-green-200 transition-colors duration-300">Categories</div>
                          <div className="text-xs sm:text-sm font-bold text-white group-hover:text-green-300 transition-colors duration-300">{part.progress.length}</div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-700/50 to-gray-600/50 rounded-lg p-1.5 sm:p-2 hover:from-purple-600/30 hover:to-purple-500/30 transition-all duration-300 group-hover:scale-105 transform hover:shadow-lg hover:shadow-purple-500/25 hover:shadow-blue-500/25 hover:shadow-cyan-500/25 hover:shadow-white/10 hover:shadow-yellow-500/25 hover:shadow-green-500/25">
                          <div className="text-xs text-gray-400 group-hover:text-purple-200 transition-colors duration-300">Status</div>
                          <div className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300 transition-colors duration-300">
                            {overallProgress === 100 ? 'Complete' : overallProgress > 0 ? 'Active' : 'Pending'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Spacer for more distance */}
                    <div className="h-6 sm:h-8"></div>

                    {/* Manage Progress Button */}
                    <Link to={`/progress/manage_progres/${part.id}`}>
                      <Button className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 text-white border-0 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group-hover:shadow-2xl hover:shadow-blue-500/25 hover:shadow-purple-500/25 hover:shadow-cyan-500/25 hover:shadow-white/10 hover:shadow-yellow-500/25 hover:shadow-green-500/25">
                        <Settings className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300 group-hover:animate-pulse" />
                        <span className="hidden sm:inline">Manage Progress</span>
                        <span className="sm:hidden">Manage</span>
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
              } catch (error) {
                console.error("Error rendering part card:", error, part);
                return null; // Skip rendering this card if there's an error
              }
            })}
          </div>

          {/* Empty State */}
          {filteredParts.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">
                {searchQuery ? 'No Parts Found' : 'No Parts Added Yet'}
              </h3>
              <p className="text-sm sm:text-base text-gray-400 mb-6 px-4">
                {searchQuery ? `No parts match your search for "${searchQuery}". Try a different search term.` : 'Start by adding your first part to create a project to-do list.'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Your First Part</span>
                  <span className="sm:hidden">Add First Part</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Part Modal */}
      <AddPartModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddPart={handleAddPart}
      />

      <style>{`
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
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
        
        @keyframes progress-fill {
          from {
            width: 0%;
          }
          to {
            width: var(--progress-width);
          }
        }
        
        @keyframes progress-bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0, -8px, 0);
          }
          70% {
            transform: translate3d(0, -4px, 0);
          }
          90% {
            transform: translate3d(0, -2px, 0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .animate-progress-fill {
          animation: progress-fill 1.5s ease-out forwards;
        }
        
        .animate-progress-bounce {
          animation: progress-bounce 1s ease-out;
        }
        
        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 1;
        }
        
        .progress-bar-glow {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        }
        
        .progress-complete {
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
        }
        
        .progress-warning {
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
        }
        
        .progress-danger {
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
        }
        
        .skeleton-loading {
          background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
        }
        
        @keyframes skeleton-loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .confetti {
          animation: confetti 3s ease-out forwards;
        }
        
        /* Mobile touch improvements */
        @media (max-width: 640px) {
          .group:hover\:scale-\[1\.02\]:hover {
            transform: none;
          }
          
          .group:hover\:scale-110:hover {
            transform: none;
          }
          
          .group:hover\:scale-125:hover {
            transform: none;
          }
          
          .group:hover\:scale-150:hover {
            transform: none;
          }
          
          .group:hover\:rotate-12:hover {
            transform: none;
          }
          
          .group:hover\:animate-bounce:hover {
            animation: none;
          }
          
          .group:hover\:animate-pulse:hover {
            animation: none;
          }
          
          .group:hover\:animate-progress-bounce:hover {
            animation: none;
          }
          
          .group:hover\:font-bold:hover {
            font-weight: inherit;
          }
          
          .group:hover\:text-white:hover {
            color: inherit;
          }
          
          .group:hover\:text-blue-300:hover {
            color: inherit;
          }
          
          .group:hover\:text-blue-200:hover {
            color: inherit;
          }
          
          .group:hover\:text-green-300:hover {
            color: inherit;
          }
          
          .group:hover\:text-green-200:hover {
            color: inherit;
          }
          
          .group:hover\:text-purple-300:hover {
            color: inherit;
          }
          
          .group:hover\:text-purple-200:hover {
            color: inherit;
          }
          
          .group:hover\:bg-gray-750:hover {
            background-color: inherit;
          }
          
          .group:hover\:border-blue-500\/30:hover {
            border-color: inherit;
          }
          
          .group:hover\:shadow-2xl:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-xl:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-lg:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-md:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-sm:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-blue-500\/10:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-purple-500\/10:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-cyan-500\/10:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-white\/5:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-yellow-500\/10:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-green-500\/10:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-blue-500\/25:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-purple-500\/25:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-cyan-500\/25:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-white\/10:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-yellow-500\/25:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-green-500\/25:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-blue-500\/20:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-purple-500\/20:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-cyan-500\/20:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-white\/10:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-yellow-500\/20:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-green-500\/20:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-blue-500\/30:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-purple-500\/30:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-cyan-500\/30:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-white\/20:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-yellow-500\/30:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-green-500\/30:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-blue-500\/50:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-purple-500\/50:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-cyan-500\/50:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-white\/30:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-yellow-500\/50:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:shadow-green-500\/50:hover {
            box-shadow: inherit;
          }
          
          .group:hover\:from-blue-600\/30:hover {
            background-image: inherit;
          }
          
          .group:hover\:to-blue-500\/30:hover {
            background-image: inherit;
          }
          
          .group:hover\:from-green-600\/30:hover {
            background-image: inherit;
          }
          
          .group:hover\:to-green-500\/30:hover {
            background-image: inherit;
          }
          
          .group:hover\:from-purple-600\/30:hover {
            background-image: inherit;
          }
          
          .group:hover\:to-purple-500\/30:hover {
            background-image: inherit;
          }
          
          .group:hover\:from-gray-600\/50:hover {
            background-image: inherit;
          }
          
          .group:hover\:to-gray-500\/50:hover {
            background-image: inherit;
          }
          
          .group:hover\:from-gray-700\/80:hover {
            background-image: inherit;
          }
          
          .group:hover\:to-gray-600\/80:hover {
            background-image: inherit;
          }
          
          .group:hover\:from-gray-800\/80:hover {
            background-image: inherit;
          }
          
          .group:hover\:to-gray-700\/80:hover {
            background-image: inherit;
          }
          
          .group:hover\:from-blue-600:hover {
            background-image: inherit;
          }
          
          .group:hover\:via-purple-600:hover {
            background-image: inherit;
          }
          
          .group:hover\:to-cyan-600:hover {
            background-image: inherit;
          }
          
          .group:hover\:from-green-600:hover {
            background-image: inherit;
          }
          
          .group:hover\:to-emerald-600:hover {
            background-image: inherit;
          }
          
          .group:hover\:opacity-75:hover {
            opacity: inherit;
          }
          
          .group:hover\:blur-md:hover {
            filter: inherit;
          }
          
          .group:hover\:blur-sm:hover {
            filter: inherit;
          }
          
          .group:hover\:via-white\/30:hover {
            background-image: inherit;
          }
          
          .group:hover\:bg-yellow-300:hover {
            background-color: inherit;
          }
          
          .group:hover\:bg-gray-600\/50:hover {
            background-color: inherit;
          }
          
          .group:hover\:bg-gray-700\/80:hover {
            background-color: inherit;
          }
        }
      `}</style>
    </div>
  );
}
