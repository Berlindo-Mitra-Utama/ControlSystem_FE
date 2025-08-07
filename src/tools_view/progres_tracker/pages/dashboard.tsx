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
import { getAllParts, createPart } from '../../../services/API_Services';

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
  // Validate image URL
  let partImageUrl = part.partImageUrl || part.partImage || '';
  
  console.log('Original partImageUrl:', partImageUrl);
  console.log('Full part data:', part);
  
  // Backend now sends full URLs, so we don't need to add base URL
  // Just validate that the URL is correct
  if (partImageUrl && !partImageUrl.startsWith('http')) {
    // If it's still a relative path, add base URL (fallback)
    if (!partImageUrl.startsWith('/')) {
      partImageUrl = `/${partImageUrl}`;
    }
    partImageUrl = `http://localhost:5555${partImageUrl}`;
  }
  
  // For external URLs that might have CORS issues, we'll skip them for now
  // and show the fallback icon instead
  if (partImageUrl && partImageUrl.startsWith('http') && !partImageUrl.includes('localhost')) {
    // Skip external URLs that might cause CORS issues, but allow localhost
    partImageUrl = '';
  }
  
  console.log('Final partImageUrl:', partImageUrl);
  
  return {
    id: part.id?.toString() || generateId(),
    partName: part.partName || part.name || '',
    partNumber: part.partNumber || '',
    customer: part.customer || '',
    partImage: part.partImage || '',
    partImageUrl: partImageUrl,
    progress: part.progress || [], // fallback to [] if not present
    createdAt: part.createdAt || new Date().toISOString(),
    status: part.status || 'active',
  };
}

// Main Dashboard Component
export default function Dashboard() {
  const [parts, setParts] = useState<Part[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
      await createPart({
        partName: partData.partName,
        partNumber: partData.partNumber,
        customer: partData.customer,
        partImage: partData.partImage,
      });
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
        setParts(mappedParts);
      } else {
        setParts([]);
      }
    } catch (error) {
      console.error('Gagal menambah part:', error);
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
          {/* Header with title and add button - Modern Design */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-0 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">
                  Engineering Project List
                </h1>
                <p className="text-sm sm:text-base text-gray-400 mt-1">
                  Track and manage your engineering projects
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
              {/* Search Box - Modern Design */}
              <div className="relative flex-1 sm:flex-none sm:w-80">
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

              {/* Add New Part Button - Modern Design */}
              <Button
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white border-0 flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-semibold text-base shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add New Part</span>
                <span className="sm:hidden">Add Part</span>
              </Button>
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

          {/* Summary Stats - Modern Design with Dark Background */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-2">
                  {parts.length}
                </div>
                <div className="text-sm sm:text-base text-blue-300 font-medium">
                  Total Parts
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 backdrop-blur-sm hover:border-green-500/50 transition-all duration-300">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">
                  {
                    parts.filter(
                      (part) => calculateOverallProgress(part) === 100,
                    ).length
                  }
                </div>
                <div className="text-sm sm:text-base text-green-300 font-medium">
                  Completed
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 backdrop-blur-sm hover:border-yellow-500/50 transition-all duration-300">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2">
                  {
                    parts.filter(
                      (part) =>
                        calculateOverallProgress(part) > 0 &&
                        calculateOverallProgress(part) < 100,
                    ).length
                  }
                </div>
                <div className="text-sm sm:text-base text-yellow-300 font-medium">
                  In Progress
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 backdrop-blur-sm hover:border-gray-500/50 transition-all duration-300">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-400 mb-2">
                  {
                    parts.filter((part) => calculateOverallProgress(part) === 0)
                      .length
                  }
                </div>
                <div className="text-sm sm:text-base text-gray-300 font-medium">
                  Not Started
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Parts Grid - Modern Design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredParts.map((part, index) => {
              try {
                const overallProgress = calculateOverallProgress(part);
                const statusInfo = getStatusInfo(overallProgress);
                const StatusIcon = statusInfo.icon;

                return (
                  <Card
                    key={part.id}
                    className="bg-gradient-to-br from-gray-800 via-gray-750 to-gray-900 border border-gray-700/50 hover:border-gray-600/80 transition-all duration-500 hover:shadow-2xl group animate-fade-in hover:bg-gray-750/90 hover:scale-[1.02] hover:border-blue-500/40 hover:shadow-blue-500/20 hover:shadow-purple-500/20 hover:shadow-cyan-500/20 hover:shadow-white/10 hover:shadow-yellow-500/20 hover:shadow-green-500/20 sm:hover:scale-[1.02] backdrop-blur-sm card-hover"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-3 sm:pb-4">
                      {/* Part Image - Modern design with full width and fixed height */}
                      <div className="mb-6 flex justify-center">
                        <div className="relative group/image w-full">
                          <div className="w-full h-36 bg-gradient-to-br from-gray-700/80 to-gray-800/80 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-600/50 shadow-2xl backdrop-blur-sm relative">
                            {part.partImageUrl && part.partImageUrl.trim() !== '' ? (
                              <img
                                src={part.partImageUrl}
                                alt={part.partName}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-110"
                                onError={(e) => {
                                  console.error('Error loading image:', part.partImageUrl);
                                  console.error('Error details:', e);
                                  e.currentTarget.style.display = "none";
                                  // Show fallback icon
                                  const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
                                  if (fallback) {
                                    fallback.classList.remove('hidden');
                                  }
                                }}
                                onLoad={(e) => {
                                  console.log('Image loaded successfully:', part.partImageUrl);
                                  // Hide fallback when image loads successfully
                                  const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
                                  if (fallback) {
                                    fallback.classList.add('hidden');
                                  }
                                }}
                                crossOrigin="anonymous"
                              />
                            ) : null}
                            {/* Fallback icon - always present but hidden when image loads */}
                            <div className="image-fallback absolute inset-0 flex items-center justify-center text-gray-400">
                              <Image className="w-16 h-16" />
                            </div>
                          </div>
                          {/* Glow effect on hover */}
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 opacity-0 group-hover/image:opacity-100 transition-opacity duration-500 blur-xl"></div>
                        </div>
                      </div>
                      
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg sm:text-xl text-white font-bold line-clamp-1 mb-1">
                                {part.partName || '-'}
                              </CardTitle>
                              <p className="text-sm sm:text-base text-gray-300 font-medium">
                                {part.partNumber || '-'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 sm:gap-3">
                            <Badge className="bg-gradient-to-r from-blue-600/90 to-blue-700/90 text-white border-0 px-3 py-1.5 text-sm font-medium shadow-lg backdrop-blur-sm">
                              {part.customer || '-'}
                            </Badge>
                            <Badge
                              className={`bg-gradient-to-r ${statusInfo.color} text-white border-0 px-3 py-1.5 text-sm font-medium flex items-center gap-2 shadow-lg backdrop-blur-sm`}
                            >
                              <StatusIcon className="w-4 h-4" />
                              <span className="hidden sm:inline">
                                {statusInfo.text}
                              </span>
                              <span className="sm:hidden">
                                {statusInfo.text.length > 8
                                  ? statusInfo.text.substring(0, 8) + "..."
                                  : statusInfo.text}
                              </span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                                         <CardContent className="space-y-6 sm:space-y-8">
                       {/* Progress Indicator - Modern design */}
                       <div className="relative group/progress">
                         <div className="flex justify-between items-center mb-4 sm:mb-6">
                           <div className="flex items-center gap-3 sm:gap-4">
                             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                               <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                             </div>
                             <span className="text-sm sm:text-base font-semibold text-gray-200">
                               Progress
                             </span>
                           </div>
                           <div className="flex items-center gap-3 sm:gap-4">
                             <span className="text-xl sm:text-2xl font-bold text-white">
                               {overallProgress}%
                             </span>
                             <div
                               className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-lg ${overallProgress === 100 ? "bg-green-400" : overallProgress >= 75 ? "bg-blue-400" : overallProgress >= 50 ? "bg-yellow-400" : overallProgress >= 25 ? "bg-purple-400" : "bg-gray-400"}`}
                             />
                           </div>
                         </div>
                         
                         {/* Modern Progress Bar */}
                         <div className="w-full bg-gray-700/50 rounded-full h-2 sm:h-3 overflow-hidden backdrop-blur-sm">
                           <div 
                             className={`h-full rounded-full transition-all duration-1000 ease-out ${
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

                       {/* Manage Progress Button - Modern design */}
                       <Link to={`/progress/manage_progres/${part.id}`}>
                         <Button className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 text-white border-0 flex items-center justify-center gap-3 py-4 sm:py-5 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] group-hover:shadow-2xl hover:shadow-blue-500/30 hover:shadow-purple-500/30 hover:shadow-cyan-500/30 hover:shadow-white/20 rounded-xl font-semibold text-base sm:text-lg">
                           <Settings className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform duration-300 group-hover:animate-pulse" />
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
              {!searchQuery && (
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white border-0 flex items-center justify-center gap-3 py-4 px-8 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
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
