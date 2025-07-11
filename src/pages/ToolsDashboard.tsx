import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import {
  Calendar,
  BarChart3,
  LogOut,
  User,
  Settings,
  Users,
  FileText,
  Database,
  Shield,
  Activity,
  TrendingUp,
  Wrench,
  Lock,
  Unlock,
  Calculator,
  PieChart,
  Factory,
  ArrowLeft,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ToolsDashboard() {
  const { isLoggedIn, user, handleLogout } = useAuth();
  const [showToolsView, setShowToolsView] = useState(false);
  const navigate = useNavigate();

  const handleToolSelect = (toolId: string, requiresLogin: boolean) => {
    if (requiresLogin && !isLoggedIn) {
      navigate(`/login?tool=${toolId}`); // ✅ Sudah benar
    } else {
      switch (toolId) {
        case "scheduler":
          navigate("/dashboard"); // Mengarahkan ke Control System
          break;
        case "hitungcoil":
          navigate("/hitungcoil"); // Mengarahkan ke Hitung Coil
          break;
        default:
          alert(`Mengakses tool: ${toolId}`);
      }
    }
  };

  // Define tools based on user roles
  const getToolsForRole = (role: string) => {
    const baseTools = [
      {
        id: "hitungcoil",
        title: "Hitung Coil",
        description:
          "Kalkulasi otomatis untuk perhitungan coil dengan akurasi tinggi dan efisiensi maksimal",
        icon: BarChart3,
        gradient: "from-green-500 to-teal-600",
        hoverGradient: "from-green-700 to-teal-700",
        category: "production",
        badge: "Produksi",
      },
    ];

    const plannerTools = [
      {
        id: "scheduler",
        title: "Kontrol Planning",
        description:
          "Sistem perencanaan produksi komprehensif untuk mengatur jadwal dan alokasi sumber daya",
        icon: Calendar,
        gradient: "from-blue-500 to-indigo-600",
        hoverGradient: "from-blue-700 to-indigo-700",
        category: "planning",
        badge: "Planning",
      },
      {
        id: "reports",
        title: "Laporan Produksi",
        description:
          "Generate dan analisis laporan produksi harian, mingguan, dan bulanan",
        icon: FileText,
        gradient: "from-purple-500 to-pink-600",
        hoverGradient: "from-purple-700 to-pink-700",
        category: "reporting",
        badge: "Laporan",
      },
    ];

    const supervisorTools = [
      {
        id: "monitoring",
        title: "Monitoring Real-time",
        description:
          "Monitor status produksi dan performa mesin secara real-time",
        icon: Activity,
        gradient: "from-orange-500 to-red-600",
        hoverGradient: "from-orange-700 to-red-700",
        category: "monitoring",
        badge: "Monitoring",
      },
      {
        id: "analytics",
        title: "Analytics Dashboard",
        description:
          "Analisis mendalam performa produksi dan trend operasional",
        icon: TrendingUp,
        gradient: "from-cyan-500 to-blue-600",
        hoverGradient: "from-cyan-700 to-blue-700",
        category: "analytics",
        badge: "Analytics",
      },
    ];

    const adminTools = [
      {
        id: "usermanagement",
        title: "Manajemen User",
        description: "Kelola pengguna, role, dan permission sistem",
        icon: Users,
        gradient: "from-indigo-500 to-purple-600",
        hoverGradient: "from-indigo-700 to-purple-700",
        category: "admin",
        badge: "Admin",
      },
      {
        id: "systemconfig",
        title: "Konfigurasi Sistem",
        description: "Pengaturan sistem, backup, dan maintenance",
        icon: Settings,
        gradient: "from-gray-500 to-gray-700",
        hoverGradient: "from-gray-700 to-gray-900",
        category: "admin",
        badge: "System",
      },
    ];

    switch (role) {
      case "admin":
        return [
          ...baseTools,
          ...plannerTools,
          ...supervisorTools,
          ...adminTools,
        ];
      case "supervisor":
        return [...baseTools, ...plannerTools, ...supervisorTools];
      case "planner":
        return [...baseTools, ...plannerTools];
      case "operator":
      default:
        return baseTools;
    }
  };

  // All tools for public view
  const allTools = [
    // Public Tools
    {
      id: "calculator",
      title: "Kalkulator",
      description: "Kalkulator untuk perhitungan cepat produksi",
      icon: Calculator,
      gradient: "from-green-400 to-emerald-500",
      hoverGradient: "from-green-500 to-emerald-600",
      category: "public",
      badge: "Open",
      requiresLogin: false,
      badgeColor: "bg-green-500/10 text-green-400 border-green-500/20",
    },
    {
      id: "converter",
      title: "Unit Converter",
      description:
        "Konversi satuan untuk produksi dan engineering calculations",
      icon: PieChart,
      gradient: "from-blue-400 to-cyan-500",
      hoverGradient: "from-blue-500 to-cyan-600",
      category: "public",
      badge: "Open",
      requiresLogin: false,
      badgeColor: "bg-green-500/10 text-green-400 border-green-500/20",
    },
    {
      id: "hitungcoil",
      title: "Hitung Coil",
      description: "Kalkulasi material coil dan inventory management system",
      icon: BarChart3,
      gradient: "from-orange-500 to-red-500",
      hoverGradient: "from-orange-600 to-red-600",
      category: "public",
      badge: "Open",
      requiresLogin: false,
      badgeColor: "bg-green-500/10 text-green-400 border-green-500/20",
    },
    // Professional Tools
    {
      id: "scheduler",
      title: "Planning System",
      description:
        "Sistem perencanaan dan penjadwalan produksi harian dengan resource allocation",
      icon: Calendar,
      gradient: "from-purple-500 to-pink-500",
      hoverGradient: "from-purple-600 to-pink-600",
      category: "professional",
      badge: "Staff Only",
      requiresLogin: true,
      badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    },
    {
      id: "reports",
      title: "Laporan Produksi",
      description: "Generate laporan harian dan bulanan",
      icon: FileText,
      gradient: "from-indigo-500 to-purple-500",
      hoverGradient: "from-indigo-600 to-purple-600",
      category: "professional",
      badge: "Staff Only",
      requiresLogin: true,
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    // Management Tools (Tambahkan bagian ini)
    {
      id: "analytics",
      title: "Analytics",
      description:
        "Analisis performa dan trend produksi dengan business intelligence dashboard",
      icon: TrendingUp,
      gradient: "from-red-500 to-pink-500",
      hoverGradient: "from-red-600 to-pink-600",
      category: "management",
      badge: "Management",
      requiresLogin: true,
      badgeColor: "bg-red-500/10 text-red-400 border-red-500/20",
    },
    {
      id: "usermanagement",
      title: "User Management",
      description: "Kelola akses pengguna sistem",
      icon: Users,
      gradient: "from-gray-600 to-gray-800",
      hoverGradient: "from-gray-700 to-gray-900",
      category: "management",
      badge: "Admin Only",
      requiresLogin: true,
      badgeColor: "bg-red-500/10 text-red-400 border-red-500/20",
    },
    {
      id: "systemconfig",
      title: "System Config",
      description:
        "Konfigurasi dan maintenance sistem dengan advanced settings dan backup management",
      icon: Settings,
      gradient: "from-yellow-500 to-orange-500",
      hoverGradient: "from-yellow-600 to-orange-600",
      category: "management",
      badge: "Admin Only",
      requiresLogin: true,
      badgeColor: "bg-red-500/10 text-red-400 border-red-500/20",
    },
  ];

  const renderToolCard = (tool: any, isPublicView = false) => {
    const IconComponent = tool.icon;
    const LockIcon = tool.requiresLogin ? Lock : Unlock;

    const handleCardClick = () => {
      isPublicView
        ? handleToolSelect(tool.id, tool.requiresLogin)
        : handleToolSelect(tool.id, false);
    };

    return (
      <div
        key={tool.id}
        className={`
          border rounded-lg transition-all duration-300 cursor-pointer group relative overflow-hidden h-full flex flex-col
          ${
            tool.requiresLogin && isPublicView
              ? "bg-gray-800/30 border-gray-600 hover:bg-gray-800/50"
              : "bg-gray-800/50 border-gray-700 hover:bg-gray-800/70"
          }
        `}
        onClick={handleCardClick}
      >
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="relative">
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-r ${tool.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
              >
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              {isPublicView && (
                <div
                  className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                    tool.requiresLogin ? "bg-orange-500" : "bg-green-500"
                  }`}
                >
                  <LockIcon className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            <div
              className={`
              inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold
              ${
                isPublicView
                  ? tool.badgeColor
                  : `
                ${tool.category === "admin" ? "bg-red-500/10 text-red-400 border-red-500/20" : ""}
                ${tool.category === "planning" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : ""}
                ${tool.category === "production" ? "bg-green-500/10 text-green-400 border-green-500/20" : ""}
                ${tool.category === "monitoring" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : ""}
                ${tool.category === "reporting" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : ""}
                ${tool.category === "analytics" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : ""}
              `
              }
            `}
            >
              {tool.badge}
            </div>
          </div>

          <div className="mb-3">
            <h3
              className={`text-lg font-semibold leading-tight ${tool.requiresLogin && isPublicView ? "text-gray-300" : "text-white"}`}
            >
              {tool.title}
            </h3>
          </div>

          <div className="flex-1 mb-4 flex items-start">
            <p
              className={`text-sm leading-relaxed ${
                tool.requiresLogin && isPublicView
                  ? "text-gray-500"
                  : "text-gray-400"
              }`}
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                minHeight: "3.6rem",
              }}
            >
              {tool.description}
            </p>
          </div>

          <div className="mt-auto">
            <Button
              onClick={handleCardClick}
              className={`w-full rounded-lg ${
                tool.requiresLogin && isPublicView
                  ? `bg-gradient-to-r ${tool.gradient} hover:${tool.hoverGradient} opacity-90`
                  : `bg-gradient-to-r ${tool.gradient} hover:${tool.hoverGradient}`
              }`}
            >
              {isPublicView && tool.requiresLogin ? (
                <>
                  <Lock className="w-3 h-3 mr-2" />
                  Login Required
                </>
              ) : isPublicView ? (
                <>
                  <Unlock className="w-3 h-3 mr-2" />
                  Akses Langsung
                </>
              ) : (
                `Akses ${tool.title}`
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Public tools view or logged in tools view
  const publicTools = allTools.filter((tool) => !tool.requiresLogin);
  const staffTools = allTools.filter(
    (tool) => tool.requiresLogin && tool.category === "professional",
  );
  const managementTools = allTools.filter(
    (tool) => tool.requiresLogin && tool.category === "management",
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <Factory className="w-6 h-6 text-blue-400" />
                <h1 className="text-xl font-bold text-white">
                  Production Tools
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isLoggedIn && showToolsView && (
                <Button
                  onClick={() => setShowToolsView(false)}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
                >
                  Dashboard
                </Button>
              )}
              {isLoggedIn && user && (
                <div className="flex items-center space-x-2 text-gray-300 bg-gray-800/30 px-4 py-2 rounded-lg">
                  <User className="w-5 h-5" />
                  <span>{user.username}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Open Tools */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Unlock className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-bold text-white">Open Tools</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {publicTools.map((tool) => renderToolCard(tool, true))}
          </div>
        </div>

        {/* Staff Tools */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Staff Tools</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {staffTools.map((tool) => renderToolCard(tool, true))}
          </div>
        </div>

        {/* Management Tools */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-bold text-white">Management Tools</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {managementTools.map((tool) => renderToolCard(tool, true))}
          </div>
        </div>
      </div>
    </div>
  );
}
