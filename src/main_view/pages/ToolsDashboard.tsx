"use client"

import { useState } from "react"
import { Button } from "@heroui/react"
import {
  Calendar,
  BarChart3,
  Settings,
  Users,
  FileText,
  TrendingUp,
  Wrench,
  Lock,
  Unlock,
  Calculator,
  PieChart,
  Factory,
  ArrowLeft,
  AlertTriangle,
  X,
  Sparkles,
  Zap,
  Shield,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function ToolsDashboard() {
  const { isLoggedIn, user, handleLogout } = useAuth()
  const [showToolsView, setShowToolsView] = useState(false)
  const [maintenanceModal, setMaintenanceModal] = useState({
    isOpen: false,
    toolName: "",
    toolDescription: "",
  })
  const navigate = useNavigate()

  const handleToolSelect = (
    toolId: string,
    requiresLogin: boolean,
    maintenance: boolean,
    toolName: string,
    toolDescription: string,
  ) => {
    if (maintenance) {
      setMaintenanceModal({
        isOpen: true,
        toolName,
        toolDescription,
      })
      return
    }

    if (requiresLogin && !isLoggedIn) {
      navigate(`/login?tool=${toolId}`)
    } else {
      switch (toolId) {
        case "scheduler":
          navigate("/dashboard")
          break
        case "hitungcoil":
          navigate("/hitungcoil")
          break
        case "usermanagement":
          navigate("/admin/user-management")
          break
        default:
          alert(`Mengakses tool: ${toolId}`)
      }
    }
  }

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
      maintenance: true,
    },
    {
      id: "converter",
      title: "Unit Converter",
      description: "Konversi satuan untuk produksi dan engineering calculations",
      icon: PieChart,
      gradient: "from-blue-400 to-cyan-500",
      hoverGradient: "from-blue-500 to-cyan-600",
      category: "public",
      badge: "Open",
      requiresLogin: false,
      badgeColor: "bg-green-500/10 text-green-400 border-green-500/20",
      maintenance: true,
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
      maintenance: false,
    },
    // Professional Tools
    {
      id: "scheduler",
      title: "Planning System",
      description: "Sistem perencanaan dan penjadwalan produksi harian dengan resource allocation",
      icon: Calendar,
      gradient: "from-purple-500 to-pink-500",
      hoverGradient: "from-purple-600 to-pink-600",
      category: "professional",
      badge: "Staff Only",
      requiresLogin: true,
      badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      maintenance: false,
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
      maintenance: true,
    },
    // Management Tools
    {
      id: "analytics",
      title: "Analytics",
      description: "Analisis performa dan trend produksi dengan business intelligence dashboard",
      icon: TrendingUp,
      gradient: "from-red-500 to-pink-500",
      hoverGradient: "from-red-600 to-pink-600",
      category: "management",
      badge: "Management",
      requiresLogin: true,
      badgeColor: "bg-red-500/10 text-red-400 border-red-500/20",
      maintenance: true,
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
      maintenance: false,
    },
    {
      id: "systemconfig",
      title: "System Config",
      description: "Konfigurasi dan maintenance sistem dengan advanced settings dan backup management",
      icon: Settings,
      gradient: "from-yellow-500 to-orange-500",
      hoverGradient: "from-yellow-600 to-orange-600",
      category: "management",
      badge: "Admin Only",
      requiresLogin: true,
      badgeColor: "bg-red-500/10 text-red-400 border-red-500/20",
      maintenance: true,
    },
  ]

  const renderToolCard = (tool: any, isPublicView = false) => {
    const IconComponent = tool.icon
    const LockIcon = tool.requiresLogin ? Lock : Unlock

    const handleCardClick = () => {
      handleToolSelect(tool.id, tool.requiresLogin, tool.maintenance, tool.title, tool.description)
    }

    const getBadgeStyle = () => {
      if (tool.maintenance) return "bg-red-500/20 text-red-400 border-red-500/30"
      if (tool.category === "public") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      if (tool.category === "professional") return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      return "bg-red-500/20 text-red-400 border-red-500/30"
    }

    const getBadgeIcon = () => {
      if (tool.maintenance) return <AlertTriangle className="w-3 h-3" />
      if (tool.category === "public") return <Unlock className="w-3 h-3" />
      if (tool.category === "professional") return <Zap className="w-3 h-3" />
      return <Shield className="w-3 h-3" />
    }

    return (
      <div
        key={tool.id}
        className={`
          group relative overflow-hidden transition-all duration-300 cursor-pointer border border-gray-700/50 rounded-xl
          ${
            tool.maintenance
              ? "bg-gradient-to-br from-gray-900/50 to-gray-800/50 hover:from-gray-900/70 hover:to-gray-800/70"
              : "bg-gradient-to-br from-gray-900/80 to-gray-800/80 hover:from-gray-900 hover:to-gray-800"
          }
          hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 hover:border-gray-600/50
        `}
        onClick={handleCardClick}
      >
        {/* Animated background gradient */}
        <div
          className={`
            absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300
            bg-gradient-to-br ${tool.gradient}
          `}
        />

        {/* Glow effect */}
        <div
          className={`
            absolute -inset-0.5 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm
            bg-gradient-to-r ${tool.gradient}
          `}
        />

        <div className="p-6 relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="relative">
              <div
                className={`
                  w-14 h-14 rounded-xl bg-gradient-to-br ${tool.maintenance ? "from-gray-600 to-gray-700" : tool.gradient} 
                  flex items-center justify-center group-hover:scale-110 transition-all duration-300
                  shadow-lg group-hover:shadow-xl
                `}
              >
                {tool.maintenance ? (
                  <Wrench className="w-7 h-7 text-white" />
                ) : (
                  <IconComponent className="w-7 h-7 text-white" />
                )}
              </div>

              {/* Status indicator */}
              {isPublicView && !tool.maintenance && (
                <div
                  className={`
                    absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center
                    ${tool.requiresLogin ? "bg-orange-500" : "bg-emerald-500"}
                    shadow-lg animate-pulse
                  `}
                >
                  <LockIcon className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <div
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold ${getBadgeStyle()}`}
            >
              {getBadgeIcon()}
              {tool.maintenance ? "Maintenance" : tool.badge}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                {tool.title}
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-1">{tool.stats}</p>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed min-h-[3rem] line-clamp-3">
              {tool.maintenance ? "Tool sedang dalam maintenance. Klik untuk info lebih lanjut." : tool.description}
            </p>
          </div>

          {/* Action Button */}
          <div className="mt-6">
            <button
              onClick={handleCardClick}
              className={`
                w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2
                ${
                  tool.maintenance
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : `bg-gradient-to-r ${tool.gradient} hover:shadow-lg hover:shadow-purple-500/25 text-white`
                }
                group-hover:scale-105
              `}
            >
              {tool.maintenance ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Maintenance
                </>
              ) : isPublicView && tool.requiresLogin ? (
                <>
                  <Lock className="w-4 h-4" />
                  Login Required
                </>
              ) : isPublicView ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Akses Langsung
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Akses {tool.title}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const publicTools = allTools.filter((tool) => !tool.requiresLogin)
  const staffTools = allTools.filter((tool) => tool.requiresLogin && tool.category === "professional")
  const managementTools = allTools.filter((tool) => tool.requiresLogin && tool.category === "management")

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Maintenance Modal */}
      {maintenanceModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMaintenanceModal((prev) => ({ ...prev, isOpen: false }))}
          />

          <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <button
                onClick={() => setMaintenanceModal((prev) => ({ ...prev, isOpen: false }))}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto">
                  <Wrench className="w-8 h-8 text-white" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Tool Sedang Maintenance</h2>
                  <p className="text-gray-400">
                    <span className="font-medium text-white">{maintenanceModal.toolName}</span> tidak tersedia saat ini
                  </p>
                </div>

                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-300">
                      Tool sedang dalam perbaikan. Estimasi waktu: 1-3 jam. Silakan coba lagi nanti.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setMaintenanceModal((prev) => ({ ...prev, isOpen: false }))}
                  className="w-full py-3 px-4 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 rounded-lg font-semibold transition-all duration-200"
                >
                  Mengerti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
              <button className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent rounded-lg transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Home
              </button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Factory className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Production Tools
                  </h1>
                  <p className="text-sm text-gray-400">Sistem manajemen produksi terintegrasi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-12">
        {/* Open Tools */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-md flex items-center justify-center">
              <Unlock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Open Tools</h2>
              <p className="text-sm text-gray-400">Akses langsung tanpa login</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicTools.map((tool) => renderToolCard(tool, true))}
          </div>
        </section>

        {/* Staff Tools */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-violet-600 rounded-md flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Staff Tools</h2>
              <p className="text-sm text-gray-400">Khusus untuk staff produksi</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staffTools.map((tool) => renderToolCard(tool, true))}
          </div>
        </section>

        {/* Management Tools */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-md flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Management Tools</h2>
              <p className="text-sm text-gray-400">Akses terbatas untuk manajemen</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managementTools.map((tool) => renderToolCard(tool, true))}
          </div>
        </section>
      </div>
    </div>
  )
}
