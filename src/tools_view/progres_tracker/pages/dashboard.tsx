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
import { getAllParts, createPart, deletePart } from '../../../services/API_Services';

// Helper function to generate unique IDs
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

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
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Calendar,
  SortAsc,
  SortDesc,
  Trash2,
} from "lucide-react";

// Types and Interfaces
interface Evidence {
  id: string;
  name: string;
  type: "image" | "file";
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
  toolingDetail?: any;
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
  partImageUrl?: string; // URL untuk menampilkan gambar
  progress: ProgressCategory[];
  createdAt: string;
  status: "active" | "completed" | "on-hold";
  overallProgress?: number;
}

// Add Part Modal Component
interface AddPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPart: (
    part: {
      partName: string;
      partNumber: string;
      customer: string;
      partImage?: File;
      status: "active";
    },
  ) => void;
}

function AddPartModal({ isOpen, onClose, onAddPart }: AddPartModalProps) {
  const [formData, setFormData] = useState({
    partName: "",
    partNumber: "",
    customer: "",
    partImage: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    // Validasi ukuran file (5MB)
    if (file && file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB.');
      e.target.value = '';
      return;
    }
    
    setFormData({ ...formData, partImage: file });
    
    // Create preview
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.partName && formData.partNumber && formData.customer) {
      onAddPart({
        partName: formData.partName,
        partNumber: formData.partNumber,
        customer: formData.customer,
        partImage: formData.partImage || undefined,
        status: "active",
      });
      setFormData({
        partName: "",
        partNumber: "",
        customer: "",
        partImage: null,
      });
      setImagePreview(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[92vw] max-w-md sm:w-auto bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 text-white mx-auto">
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
              onChange={(e) =>
                setFormData({ ...formData, partName: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, partNumber: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, customer: e.target.value })
              }
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
              placeholder="Enter customer name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Part Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm sm:text-base file:bg-gray-600 file:border-0 file:text-white file:px-3 file:py-1 file:rounded file:mr-3 file:text-sm"
            />
            {imagePreview && (
              <div className="mt-2 space-y-2">
                <div className="flex justify-center items-center">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-sm max-h-32 object-contain rounded-md"
                  />
                </div>
                {formData.partImage && (
                  <div className="text-xs text-gray-400 text-center">
                    {formData.partImage.name} ({(formData.partImage.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>
            )}
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

// Helper to map backend part data to frontend Part type
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
        completed: !!process.completed, // Ensure boolean
        notes: process.notes || '',
        children: process.children ? process.children.map((child: any) => ({
          id: child.id?.toString() || generateId(),
          name: child.name || '',
          completed: !!child.completed, // Ensure boolean
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
  
  return {
    id: part.id?.toString() || generateId(),
    partName: part.partName || part.name || '',
    partNumber: part.partNumber || '',
    customer: part.customer || '',
    partImage: part.partImage || '',
    partImageUrl: partImageUrl,
    // Use the properly mapped progress data
    progress: progressData,
    createdAt: part.createdAt || new Date().toISOString(),
    status: part.status || 'active',
    overallProgress: typeof part.overallProgress === 'number' ? Math.round(part.overallProgress) : undefined,
  };
}

// Main Dashboard Component
export default function Dashboard() {
  const [parts, setParts] = useState<Part[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = 6; // max 6 part per halaman (3 kolom x 2 baris)
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [partToDelete, setPartToDelete] = useState<Part | null>(null);
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  // Fetch parts from backend on mount
  useEffect(() => {
    const fetchParts = async () => {
      try {
        const response = await getAllParts();
        console.log('Backend response:', response);
        let partsArray = [];
        if (Array.isArray(response.data)) {
          partsArray = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          partsArray = response.data.data;
        }
        console.log('Parts array:', partsArray);
        if (partsArray.length > 0) {
          const mappedParts = partsArray.map(mapBackendPartToFrontend);
          console.log('Mapped parts:', mappedParts);
          
          // Log completion status untuk debugging
          mappedParts.forEach((part, partIndex) => {
            console.log(`Dashboard - Part ${partIndex + 1}: ${part.partName}`);
            part.progress.forEach((category, catIndex) => {
              console.log(`  Category ${catIndex + 1}: ${category.name}`);
              category.processes.forEach((process, procIndex) => {
                console.log(`    Process ${procIndex + 1}: ${process.name} - Completed: ${process.completed}`);
                if (process.children) {
                  process.children.forEach((child, childIndex) => {
                    console.log(`      Child ${childIndex + 1}: ${child.name} - Completed: ${child.completed}`);
                  });
                }
              });
            });
          });
          
          setParts(mappedParts);
        } else {
          setParts([]);
        }
      } catch (error: any) {
        // Log full Axios error details
        if (error.response) {
          console.error('Gagal memuat data parts dari backend:', error.message);
          console.error('Status:', error.response.status);
          console.error('Response data:', error.response.data);
          console.error('Headers:', error.response.headers);
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Error setting up request:', error.message);
        }
      }
    };
    fetchParts();
  }, []);

  // Add new part (send to backend, then refresh list)
  const handleAddPart = async (
    partData: {
      partName: string;
      partNumber: string;
      customer: string;
      partImage?: File;
      status: "active";
    },
  ) => {
    try {
      console.log('Adding new part:', partData);
      await createPart({
        partName: partData.partName,
        partNumber: partData.partNumber,
        customer: partData.customer,
        partImage: partData.partImage,
      });
      console.log('Part created successfully, refreshing data...');
      
      // Re-fetch parts after adding
      const response = await getAllParts();
      console.log('Backend response after add:', response);
      let partsArray = [];
      if (Array.isArray(response.data)) {
        partsArray = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        partsArray = response.data.data;
      }
      if (partsArray.length > 0) {
        const mappedParts = partsArray.map(mapBackendPartToFrontend);
        console.log('Mapped parts after add:', mappedParts);
        setParts(mappedParts);
      } else {
        setParts([]);
      }
      
      console.log('Parts data refreshed after adding new part');
    } catch (error) {
      console.error('Gagal menambah part:', error);
      alert('Gagal menambah part. Silakan coba lagi.');
    }
  };

  // Delete part
  const handleDeletePart = async (partId: string) => {
    try {
      console.log('Deleting part:', partId);
      await deletePart(partId);
      console.log('Part deleted successfully, refreshing data...');
      
      // Re-fetch parts after deleting
      const response = await getAllParts();
      let partsArray = [];
      if (Array.isArray(response.data)) {
        partsArray = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        partsArray = response.data.data;
      }
      if (partsArray.length > 0) {
        const mappedParts = partsArray.map(mapBackendPartToFrontend);
        console.log('Mapped parts after delete:', mappedParts);
        setParts(mappedParts);
      } else {
        setParts([]);
      }
      
      setShowDeleteModal(false);
      setPartToDelete(null);
      console.log('Parts data refreshed after deleting part');
    } catch (error) {
      console.error('Gagal menghapus part:', error);
      alert('Gagal menghapus part. Silakan coba lagi.');
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (part: Part) => {
    setPartToDelete(part);
    setShowDeleteModal(true);
  };

  // Calculate overall progress for a part
  // Mengikutsertakan Progress Tooling (fractional berdasarkan toolingDetail.overallProgress)
  const calculateOverallProgress = (part: Part): number => {
    // Prefer progress yang dihitung backend agar konsisten dengan Manage Progress
    if (typeof part.overallProgress === 'number') {
      return Math.max(0, Math.min(100, Math.round(part.overallProgress)));
    }
    if (!part.progress || part.progress.length === 0) return 0;

    let totalUnits = 0;
    let completedUnits = 0;

    part.progress.forEach((category) => {
      category.processes.forEach((process) => {
        if (process.children && process.children.length > 0) {
          process.children.forEach((child) => {
            totalUnits += 1;
            if (child.name === 'Progress Tooling' && (child as any).toolingDetail && typeof (child as any).toolingDetail.overallProgress === 'number') {
              const pct = Math.max(0, Math.min(100, Number((child as any).toolingDetail.overallProgress)));
              completedUnits += pct / 100;
            } else if (child.completed) {
              completedUnits += 1;
            }
          });
        } else {
          totalUnits += 1;
          if (process.completed) completedUnits += 1;
        }
      });
    });

    const computed = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
    return Math.max(0, Math.min(100, computed));
  };

  // Helper function untuk memastikan konsistensi perhitungan progress
  // Menggunakan fungsi yang sama dengan manage progress untuk konsistensi
  const getConsistentProgress = (part: Part): number => {
    return calculateOverallProgress(part);
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
  const filteredParts = parts.filter((part) => {
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

  // Sort parts based on sortBy
  const sortedParts = [...filteredParts].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "name-asc":
        return (a.partName || "").localeCompare(b.partName || "");
      case "name-desc":
        return (b.partName || "").localeCompare(a.partName || "");
      case "customer-asc":
        return (a.customer || "").localeCompare(b.customer || "");
      case "customer-desc":
        return (b.customer || "").localeCompare(a.customer || "");
      default:
        // Default sorting (no filter applied) - show newest first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Hitung pagination untuk carousel
  const totalPages = Math.max(1, Math.ceil(sortedParts.length / pageSize));
  const clampedPage = Math.min(currentPage, totalPages - 1);
  const pagedParts = sortedParts.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize);

  // Reset halaman saat total halaman berkurang atau pencarian berubah
  useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, sortBy]);

  // Debug logging
  console.log(
    "Dashboard render - parts:",
    parts.length,
    "searchQuery:",
    searchQuery,
    "filteredParts:",
    filteredParts.length,
  );

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
          {/* Header with title - Modern Design */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-0 mb-8">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">
                  Engineering Project List
                </h1>
                <p className="text-sm sm:text-base text-gray-400 mt-1">
                  Track and manage your engineering projects
                </p>
              </div>
            </div>
          </div>

          {/* Search Results Info - Modern Design */}
          {searchQuery && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-200 font-medium">
                    Showing {filteredParts.length} of {parts.length} parts
                  </span>
                </div>
                <span className="text-gray-400 font-medium">Search: "{searchQuery}"</span>
              </div>
            </div>
          )}

          {/* Summary Stats - Compact Design */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold text-white">Project Summary</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Total Parts</span>
                </div>
                <div className="text-xl font-bold text-blue-400">
                  {parts.length}
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">Completed</span>
                </div>
                <div className="text-xl font-bold text-green-400">
                  {parts.filter((part) => getConsistentProgress(part) === 100).length}
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">In Progress</span>
                </div>
                <div className="text-xl font-bold text-yellow-400">
                  {parts.filter((part) => getConsistentProgress(part) > 0 && getConsistentProgress(part) < 100).length}
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Not Started</span>
                </div>
                <div className="text-xl font-bold text-gray-400">
                  {parts.filter((part) => getConsistentProgress(part) === 0).length}
                </div>
              </div>
            </div>
          </div>

          {/* Search and Add Section - Below Project Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="w-full max-w-[360px] mx-auto sm:max-w-none sm:w-80 sm:mx-0">
              {/* Search Box - Modern Design */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery || ""}
                  onChange={(e) => {
                    try {
                      const value = e.target.value || "";
                      setSearchQuery(value);
                    } catch (error) {
                      console.error("Error setting search query:", error);
                      setSearchQuery("");
                    }
                  }}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl pl-12 pr-12 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-base transition-all duration-300 hover:border-gray-500 backdrop-blur-sm"
                  placeholder="Search parts, numbers, customers..."
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      try {
                        setSearchQuery("");
                      } catch (error) {
                        console.error("Error clearing search query:", error);
                        setSearchQuery("");
                      }
                    }}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-300 transition-colors duration-200"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Add New Part Button and Filter Button - Side by Side */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Add New Part Button - Modern Design */}
              <Button
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white border-0 flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-semibold text-base shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add New Part</span>
                <span className="sm:hidden">Add Part</span>
              </Button>

              {/* Filter/Sort Button - Mobile */}
              <div className="sm:hidden">
                <Button
                  variant="outline"
                  className="w-full bg-gray-800/50 border border-gray-600/30 text-white hover:bg-gray-700/50 hover:border-gray-500/50 transition-all duration-300 shadow-sm hover:shadow-md"
                  onClick={() => setShowSortModal(true)}
                >
                  <span className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                      <span>
                        {sortBy === "" && "Filter by"}
                        {sortBy === "newest" && "Terbaru"}
                        {sortBy === "oldest" && "Terlama"}
                        {sortBy === "name-asc" && "Nama A-Z"}
                        {sortBy === "name-desc" && "Nama Z-A"}
                        {sortBy === "customer-asc" && "Customer A-Z"}
                        {sortBy === "customer-desc" && "Customer Z-A"}
                      </span>
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </Button>
              </div>
              
              {/* Filter/Sort Dropdown - Desktop */}
              <div className="hidden sm:block">
                <div className="relative group">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-800/50 border border-gray-600/30 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 hover:bg-gray-700/50 hover:border-gray-500/50 backdrop-blur-sm shadow-sm hover:shadow-md appearance-none pr-10"
                  >
                    <option value="" disabled>Filter by</option>
                    <option value="newest">Terbaru</option>
                    <option value="oldest">Terlama</option>
                    <option value="name-asc">Nama A-Z</option>
                    <option value="name-desc">Nama Z-A</option>
                    <option value="customer-asc">Customer A-Z</option>
                    <option value="customer-desc">Customer Z-A</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Project Parts</h2>
              <p className="text-sm text-gray-400">Manage and track your engineering parts</p>
            </div>
          </div>

          {/* Parts Grid - Compact Modern Design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagedParts.map((part, index) => {
              try {
                const overallProgress = getConsistentProgress(part);
                const statusInfo = getStatusInfo(overallProgress);
                const StatusIcon = statusInfo.icon;

                return (
                  <Card
                    key={part.id}
                    className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/40 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg group backdrop-blur-sm"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardHeader className="pb-2">
                      {/* Compact Part Image */}
                      <div className="mb-3 flex justify-center">
                        <div className="relative w-full">
                          <div className="w-full h-44 bg-gradient-to-br from-gray-700/60 to-gray-800/60 rounded-lg flex items-center justify-center overflow-hidden border border-gray-600/30">
                            {part.partImageUrl && part.partImageUrl.trim() !== '' && (isValidBase64Image(part.partImageUrl) || part.partImageUrl.startsWith('http')) ? (
                              <img
                                src={part.partImageUrl}
                                alt={part.partName}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
                                  if (fallback) fallback.classList.remove('hidden');
                                }}
                                onLoad={(e) => {
                                  const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
                                  if (fallback) fallback.classList.add('hidden');
                                }}
                                {...(part.partImageUrl.startsWith('data:') ? {} : { crossOrigin: "anonymous" })}
                              />
                            ) : null}
                            <div className="image-fallback absolute inset-0 flex items-center justify-center text-gray-400">
                              <Image className="w-8 h-8" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Compact Part Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md flex items-center justify-center flex-shrink-0">
                            <Package className="w-3 h-3 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm font-bold text-white line-clamp-1">
                              {part.partName || '-'}
                            </CardTitle>
                            <p className="text-xs text-gray-400">
                              {part.partNumber || '-'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Compact Badges */}
                        <div className="flex flex-wrap gap-1">
                          <Badge className="bg-blue-600/80 text-white border-0 px-2 py-0.5 text-xs font-medium">
                            {part.customer || '-'}
                          </Badge>
                          <Badge className={`bg-gradient-to-r ${statusInfo.color} text-white border-0 px-2 py-0.5 text-xs font-medium flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            <span className="truncate">
                              {statusInfo.text.length > 6 ? statusInfo.text.substring(0, 6) + "..." : statusInfo.text}
                            </span>
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0">
                      {/* Compact Progress Indicator */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Activity className="w-3 h-3 text-blue-400" />
                            <span className="text-xs font-medium text-gray-300">Progress</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {overallProgress}%
                            </span>
                            <div className={`w-2 h-2 rounded-full ${overallProgress === 100 ? "bg-green-400" : overallProgress >= 75 ? "bg-blue-400" : overallProgress >= 50 ? "bg-yellow-400" : overallProgress >= 25 ? "bg-purple-400" : "bg-gray-400"}`} />
                          </div>
                        </div>
                        
                        {/* Compact Progress Bar */}
                        <div className="w-full bg-gray-700/30 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ease-out ${
                              overallProgress === 100 
                                ? "bg-gradient-to-r from-green-400 to-emerald-500" 
                                : overallProgress >= 75 
                                ? "bg-gradient-to-r from-blue-400 to-cyan-500" 
                                : overallProgress >= 50 
                                ? "bg-gradient-to-r from-yellow-400 to-orange-500" 
                                : overallProgress >= 25 
                                ? "bg-gradient-to-r from-purple-400 to-pink-500" 
                                : "bg-gradient-to-r from-gray-400 to-gray-500"
                            }`}
                            style={{ width: `${overallProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* CRUD Buttons */}
                      <div className="flex gap-2">
                        {/* Edit/Manage Button */}
                        <Link to={`/progress/manage_progres/${part.id}`} className="flex-1">
                          <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 flex items-center justify-center gap-2 py-2 px-3 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.01] rounded-lg font-medium text-xs">
                            <Settings className="w-3 h-3" />
                            <span>Manage</span>
                          </Button>
                        </Link>
                        
                        {/* Delete Button */}
                        <Button 
                          onClick={() => handleDeleteClick(part)}
                          className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 flex items-center justify-center gap-2 py-2 px-3 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.01] rounded-lg font-medium text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              } catch (error) {
                console.error("Error rendering part card:", error, part);
                return null;
              }
            })}
          </div>

          {/* Empty State - Modern Design */}
          {filteredParts.length === 0 && (
            <div className="text-center py-12 sm:py-16">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-gray-600/50">
                  <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                </div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 opacity-0 hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-200 mb-3">
                {searchQuery ? "No Parts Found" : "No Parts Added Yet"}
              </h3>
              <p className="text-base sm:text-lg text-gray-400 mb-8 px-4 max-w-md mx-auto">
                {searchQuery
                  ? `No parts match your search for "${searchQuery}". Try a different search term.`
                  : "Start by adding your first part to create a project to-do list."}
              </p>
            </div>
          )}

          {/* Carousel Pagination Controls */}
          {filteredParts.length > 0 && (
            <div className="mt-6 flex items-center justify-between gap-4">
              <Button
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent flex items-center gap-2 px-3 py-2"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={clampedPage === 0}
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </Button>

              {/* Dots */}
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i === clampedPage ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                    aria-label={`Page ${i + 1}`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent flex items-center gap-2 px-3 py-2"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={clampedPage >= totalPages - 1}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
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

      {/* Delete Confirmation Modal - Improved UI */}
  <Dialog open={showDeleteModal} onOpenChange={() => setShowDeleteModal(false)}>
        <DialogContent className="w-[92vw] max-w-md sm:w-auto bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-700/50 text-white mx-auto shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              Konfirmasi Hapus
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
              <p className="text-gray-300">
                Apakah Anda yakin ingin menghapus part <strong className="text-white">{partToDelete?.partName}</strong>?
              </p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait part ini.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 bg-gray-900/50 transition-all duration-200"
            >
              Batal
            </Button>
            <Button
              onClick={() => partToDelete && handleDeletePart(partToDelete.id)}
              className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white transition-all duration-200"
            >
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sorting Modal for Mobile */}
  <Dialog open={showSortModal} onOpenChange={() => setShowSortModal(false)}>
        <DialogContent className="w-[92vw] max-w-sm sm:w-auto bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-700/50 text-white mx-auto shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </div>
              Urutkan Parts
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {[
              { value: "newest", label: "Terbaru", icon: "🕒" },
              { value: "oldest", label: "Terlama", icon: "🕒" },
              { value: "name-asc", label: "Nama A-Z", icon: "📝" },
              { value: "name-desc", label: "Nama Z-A", icon: "📝" },
              { value: "customer-asc", label: "Customer A-Z", icon: "👤" },
              { value: "customer-desc", label: "Customer Z-A", icon: "👤" }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSortBy(option.value);
                  setShowSortModal(false);
                }}
                className={`w-full p-4 rounded-xl border transition-all duration-200 text-left sort-option ${
                  sortBy === option.value
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/50 text-blue-300 sort-active"
                    : "bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-700/50 hover:border-gray-600/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                  {sortBy === option.value && (
                    <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full"></div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowSortModal(false)}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 bg-gray-900/50 transition-all duration-200"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
         
         @keyframes float {
           0%, 100% {
             transform: translateY(0px);
           }
           50% {
             transform: translateY(-10px);
           }
         }
         
         @keyframes glow {
           0%, 100% {
             box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
           }
           50% {
             box-shadow: 0 0 30px rgba(59, 130, 246, 0.6);
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
         
         .animate-float {
           animation: float 3s ease-in-out infinite;
         }
         
         .animate-glow {
           animation: glow 2s ease-in-out infinite;
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
         
         /* Glassmorphism effects */
         .glass {
           background: rgba(255, 255, 255, 0.1);
           backdrop-filter: blur(10px);
           border: 1px solid rgba(255, 255, 255, 0.2);
         }
         
         .glass-dark {
           background: rgba(0, 0, 0, 0.2);
           backdrop-filter: blur(10px);
           border: 1px solid rgba(255, 255, 255, 0.1);
         }
         
         /* Modern card hover effects */
         .card-hover {
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
         }
         
         .card-hover:hover {
           transform: translateY(-8px) scale(1.02);
           box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
         }
         
         /* Enhanced sorting dropdown effects */
         .sorting-dropdown-enhanced {
           position: relative;
           overflow: hidden;
         }
         
         .sorting-dropdown-enhanced::before {
           content: '';
           position: absolute;
           top: 0;
           left: -100%;
           width: 100%;
           height: 100%;
           background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
           transition: left 0.6s ease-in-out;
         }
         
         .sorting-dropdown-enhanced:hover::before {
           left: 100%;
         }
         
         /* Mobile sorting modal animations */
         .sort-option {
           position: relative;
           overflow: hidden;
         }
         
         .sort-option::before {
           content: '';
           position: absolute;
           top: 0;
           left: -100%;
           width: 100%;
           height: 100%;
           background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
           transition: left 0.4s ease-in-out;
         }
         
         .sort-option:hover::before {
           left: 100%;
         }
         
         /* Pulse animation for active sort option */
         @keyframes sort-pulse {
           0%, 100% {
             box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
           }
           50% {
             box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
           }
         }
         
         .sort-active {
           animation: sort-pulse 2s infinite;
         }
         
         /* Dark dropdown styling */
         select option {
           background-color: #1f2937 !important;
           color: #ffffff !important;
         }
         
         select option:hover {
           background-color: #374151 !important;
         }
         
         select option:checked {
           background-color: #3b82f6 !important;
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
