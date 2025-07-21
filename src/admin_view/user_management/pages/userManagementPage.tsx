"use client"

import { useState } from "react"
import { Link } from "react-router-dom";
import { Button } from "../components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/card"
import { Badge } from "../components/badge"
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  Search,
  Filter,
  Settings,
  Shield,
  User,
  Lock,
  Unlock,
  Calendar,
  BarChart3,
  Activity,
  FileText,
  Database,
  TrendingUp,
  Calculator,
  PieChart,
  Factory,
  ArrowLeft,
  AlertTriangle,
  Check,
} from "lucide-react"
import { useAuth } from "../../../main_view/contexts/AuthContext"

interface UserData {
  id: string
  name: string
  nip: string
  password: string
  role: "admin" | "supervisor" | "planner" | "operator"
  tools: string[]
  createdAt: string
  lastLogin?: string
  status: "active" | "inactive"
}

interface Tool {
  id: string
  name: string
  category: string
  icon: any
  requiresRole?: string[]
}

export default function UserManagementPage() {
  const { handleLogout } = useAuth()
  const [users, setUsers] = useState<UserData[]>([
    {
      id: "1",
      name: "John Admin",
      nip: "ADM001",
      password: "admin123",
      role: "admin",
      tools: [
        "usermanagement",
        "systemconfig",
        "database",
        "security",
        "scheduler",
        "reports",
        "monitoring",
        "analytics",
        "hitungcoil",
      ],
      createdAt: "2024-01-15",
      lastLogin: "2024-01-17",
      status: "active",
    },
    {
      id: "2",
      name: "Sarah Supervisor",
      nip: "SUP001",
      password: "super123",
      role: "supervisor",
      tools: ["scheduler", "reports", "monitoring", "analytics", "hitungcoil"],
      createdAt: "2024-01-16",
      lastLogin: "2024-01-17",
      status: "active",
    },
    {
      id: "3",
      name: "Mike Planner",
      nip: "PLN001",
      password: "plan123",
      role: "planner",
      tools: ["scheduler", "reports", "hitungcoil"],
      createdAt: "2024-01-16",
      lastLogin: "2024-01-16",
      status: "active",
    },
    {
      id: "4",
      name: "Lisa Operator",
      nip: "OPR001",
      password: "oper123",
      role: "operator",
      tools: ["hitungcoil"],
      createdAt: "2024-01-17",
      status: "inactive",
    },
  ])

  const [availableTools] = useState<Tool[]>([
    { id: "hitungcoil", name: "Hitung Coil", category: "production", icon: BarChart3 },
    { id: "scheduler", name: "Planning System", category: "planning", icon: Calendar },
    { id: "reports", name: "Laporan Produksi", category: "reporting", icon: FileText },
    { id: "monitoring", name: "Real-time Monitor", category: "monitoring", icon: Activity },
    { id: "analytics", name: "Analytics Dashboard", category: "analytics", icon: TrendingUp },
    { id: "usermanagement", name: "User Management", category: "admin", icon: Users, requiresRole: ["admin"] },
    { id: "systemconfig", name: "System Config", category: "admin", icon: Settings, requiresRole: ["admin"] },
    { id: "database", name: "Database Management", category: "admin", icon: Database, requiresRole: ["admin"] },
    { id: "security", name: "Security Center", category: "admin", icon: Shield, requiresRole: ["admin"] },
    { id: "calculator", name: "Kalkulator", category: "public", icon: Calculator },
    { id: "converter", name: "Unit Converter", category: "public", icon: PieChart },
  ])

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showToolsModal, setShowToolsModal] = useState<UserData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    nip: "",
    password: "",
    role: "operator" as UserData["role"],
    tools: [] as string[],
  })

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nip.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const validateForm = () => {
    const errors: { [key: string]: string } = {}

    if (!formData.name.trim()) errors.name = "Nama harus diisi"
    if (!formData.nip.trim()) errors.nip = "NIP harus diisi"
    if (!formData.password.trim()) errors.password = "Password harus diisi"
    if (formData.password.length < 6) errors.password = "Password minimal 6 karakter"

    // Check if NIP already exists (except when editing)
    const existingUser = users.find((u) => u.nip === formData.nip && u.id !== editingUser?.id)
    if (existingUser) errors.nip = "NIP sudah digunakan"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = () => {
    setFormData({
      name: "",
      nip: "",
      password: "",
      role: "operator",
      tools: [],
    })
    setFormErrors({})
  }

  const getDefaultToolsForRole = (role: UserData["role"]): string[] => {
    switch (role) {
      case "admin":
        return availableTools.map((tool) => tool.id)
      case "supervisor":
        return ["scheduler", "reports", "monitoring", "analytics", "hitungcoil", "calculator", "converter"]
      case "planner":
        return ["scheduler", "reports", "hitungcoil", "calculator", "converter"]
      case "operator":
        return ["hitungcoil", "calculator", "converter"]
      default:
        return ["calculator", "converter"]
    }
  }

  const handleAddUser = () => {
    if (!validateForm()) return

    const newUser: UserData = {
      id: Date.now().toString(),
      name: formData.name,
      nip: formData.nip,
      password: formData.password,
      role: formData.role,
      tools: formData.tools.length > 0 ? formData.tools : getDefaultToolsForRole(formData.role),
      createdAt: new Date().toISOString().split("T")[0],
      status: "active",
    }

    setUsers([...users, newUser])
    setShowAddForm(false)
    resetForm()
  }

  const handleEditUser = (user: UserData) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      nip: user.nip,
      password: user.password,
      role: user.role,
      tools: user.tools,
    })
  }

  const handleUpdateUser = () => {
    if (!validateForm()) return

    setUsers(
      users.map((user) =>
        user.id === editingUser?.id
          ? {
              ...user,
              ...formData,
              tools: formData.tools.length > 0 ? formData.tools : getDefaultToolsForRole(formData.role),
            }
          : user,
      ),
    )
    setEditingUser(null)
    resetForm()
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter((user) => user.id !== userId))
    setShowDeleteConfirm(null)
  }

  const handleToggleUserStatus = (userId: string) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, status: user.status === "active" ? "inactive" : "active" } : user,
      ),
    )
  }

  const handleRoleChange = (role: UserData["role"]) => {
    setFormData({
      ...formData,
      role,
      tools: getDefaultToolsForRole(role),
    })
  }

  const handleToolToggle = (toolId: string, userId?: string) => {
    if (userId) {
      // Toggle tool for existing user
      setUsers(
        users.map((user) =>
          user.id === userId
            ? {
                ...user,
                tools: user.tools.includes(toolId) ? user.tools.filter((t) => t !== toolId) : [...user.tools, toolId],
              }
            : user,
        ),
      )
    } else {
      // Toggle tool in form
      setFormData({
        ...formData,
        tools: formData.tools.includes(toolId)
          ? formData.tools.filter((t) => t !== toolId)
          : [...formData.tools, toolId],
      })
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      case "supervisor":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      case "planner":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "operator":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const getToolsByCategory = (tools: string[]) => {
    const categories = {
      admin: [] as Tool[],
      planning: [] as Tool[],
      production: [] as Tool[],
      monitoring: [] as Tool[],
      reporting: [] as Tool[],
      analytics: [] as Tool[],
      public: [] as Tool[],
    }

    tools.forEach((toolId) => {
      const tool = availableTools.find((t) => t.id === toolId)
      if (tool) {
        categories[tool.category as keyof typeof categories]?.push(tool)
      }
    })

    return categories
  }

  const canUserAccessTool = (userRole: string, tool: Tool) => {
    if (!tool.requiresRole) return true
    return tool.requiresRole.includes(userRole)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-red-400" />
                <h1 className="text-xl font-bold text-white">User Management</h1>
                <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Admin Only</Badge>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah User
              </Button>
              
                <Button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-all duration-200"
                >
                  Logout
                </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">{users.length}</div>
              <div className="text-gray-400 text-sm">Total Users</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {users.filter((u) => u.status === "active").length}
              </div>
              <div className="text-gray-400 text-sm">Active Users</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-400 mb-1">
                {users.filter((u) => u.role === "admin").length}
              </div>
              <div className="text-gray-400 text-sm">Administrators</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">{availableTools.length}</div>
              <div className="text-gray-400 text-sm">Available Tools</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="bg-gray-800/50 border-gray-700 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama atau NIP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50 focus:border-gray-500"
                >
                  <option value="all">Semua Role</option>
                  <option value="admin">Administrator</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="planner">Planner</option>
                  <option value="operator">Operator</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                        <Badge
                          className={
                            user.status === "active"
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                          }
                        >
                          {user.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>NIP: {user.nip}</span>
                        <span>•</span>
                        <span>Created: {user.createdAt}</span>
                        {user.lastLogin && (
                          <>
                            <span>•</span>
                            <span>Last Login: {user.lastLogin}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => setShowToolsModal(user)}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Tools ({user.tools.length})
                    </Button>
                    <Button
                      onClick={() => handleEditUser(user)}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleToggleUserStatus(user.id)}
                      variant="outline"
                      size="sm"
                      className={
                        user.status === "active"
                          ? "border-orange-600 text-orange-300 hover:bg-orange-700/20"
                          : "border-green-600 text-green-300 hover:bg-green-700/20"
                      }
                    >
                      {user.status === "active" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={() => setShowDeleteConfirm(user.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-600 text-red-300 hover:bg-red-700/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Password Display */}
                <div className="mb-4 p-3 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">Password:</span>
                      <span className="text-sm text-white font-mono">
                        {showPasswords[user.id] ? user.password : "••••••••"}
                      </span>
                    </div>
                    <Button
                      onClick={() => setShowPasswords({ ...showPasswords, [user.id]: !showPasswords[user.id] })}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 h-6 px-2"
                    >
                      {showPasswords[user.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>

                {/* Tools Preview */}
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Assigned Tools:</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.tools.slice(0, 6).map((toolId) => {
                      const tool = availableTools.find((t) => t.id === toolId)
                      if (!tool) return null
                      const IconComponent = tool.icon
                      return (
                        <div
                          key={toolId}
                          className="flex items-center space-x-1 bg-gray-700/50 px-2 py-1 rounded text-xs"
                        >
                          <IconComponent className="w-3 h-3" />
                          <span>{tool.name}</span>
                        </div>
                      )
                    })}
                    {user.tools.length > 6 && (
                      <div className="bg-gray-700/50 px-2 py-1 rounded text-xs text-gray-400">
                        +{user.tools.length - 6} more
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">Tidak ada user ditemukan</h3>
              <p className="text-gray-400">Coba ubah filter pencarian atau tambah user baru</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {(showAddForm || editingUser) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>{editingUser ? "Edit User" : "Tambah User Baru"}</span>
              </CardTitle>
              <CardDescription>
                {editingUser
                  ? "Ubah informasi user dan tools yang dapat diakses"
                  : "Buat akun user baru dengan role dan tools yang sesuai"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${formErrors.name ? "border-red-500" : "border-gray-600"}`}
                    placeholder="Masukkan nama lengkap"
                  />
                  {formErrors.name && <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">NIP</label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className={`w-full px-3 py-2 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${formErrors.nip ? "border-red-500" : "border-gray-600"}`}
                    placeholder="Masukkan NIP"
                  />
                  {formErrors.nip && <p className="text-red-400 text-xs mt-1">{formErrors.nip}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-3 py-2 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${formErrors.password ? "border-red-500" : "border-gray-600"}`}
                    placeholder="Masukkan password"
                  />
                  {formErrors.password && <p className="text-red-400 text-xs mt-1">{formErrors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value as UserData["role"])}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  >
                    <option value="operator">Operator</option>
                    <option value="planner">Planner</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Tools Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Tools Access</label>
                <div className="space-y-4">
                  {Object.entries(getToolsByCategory(availableTools.map((t) => t.id))).map(([category, tools]) => {
                    if (tools.length === 0) return null
                    return (
                      <div key={category}>
                        <h4 className="text-sm font-medium text-gray-400 mb-2 capitalize">{category} Tools</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {tools.map((tool) => {
                            const canAccess = canUserAccessTool(formData.role, tool)
                            const isSelected = formData.tools.includes(tool.id)
                            const IconComponent = tool.icon

                            return (
                              <div
                                key={tool.id}
                                className={`flex items-center space-x-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                                  !canAccess
                                    ? "bg-gray-700/20 border-gray-600 opacity-50 cursor-not-allowed"
                                    : isSelected
                                      ? "bg-blue-500/20 border-blue-500/50"
                                      : "bg-gray-700/30 border-gray-600 hover:bg-gray-700/50"
                                }`}
                                onClick={() => canAccess && handleToolToggle(tool.id)}
                              >
                                <div
                                  className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                    isSelected ? "bg-blue-500 border-blue-500" : "border-gray-500"
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <IconComponent className="w-4 h-4 text-gray-400" />
                                <span className={`text-sm ${canAccess ? "text-white" : "text-gray-500"}`}>
                                  {tool.name}
                                </span>
                                {!canAccess && <Lock className="w-3 h-3 text-gray-500 ml-auto" />}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <Button
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingUser(null)
                    resetForm()
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Batal
                </Button>
                <Button
                  onClick={editingUser ? handleUpdateUser : handleAddUser}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingUser ? "Update User" : "Tambah User"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tools Management Modal */}
      {showToolsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Manage Tools - {showToolsModal.name}</span>
              </CardTitle>
              <CardDescription>Kelola tools yang dapat diakses oleh user ini</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(getToolsByCategory(availableTools.map((t) => t.id))).map(([category, tools]) => {
                if (tools.length === 0) return null
                return (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-300 mb-3 capitalize flex items-center space-x-2">
                      <Factory className="w-4 h-4" />
                      <span>{category} Tools</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {tools.map((tool) => {
                        const canAccess = canUserAccessTool(showToolsModal.role, tool)
                        const hasAccess = showToolsModal.tools.includes(tool.id)
                        const IconComponent = tool.icon

                        return (
                          <div
                            key={tool.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              !canAccess
                                ? "bg-gray-700/20 border-gray-600 opacity-50"
                                : hasAccess
                                  ? "bg-green-500/20 border-green-500/50"
                                  : "bg-gray-700/30 border-gray-600"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <IconComponent className="w-5 h-5 text-gray-400" />
                              <div>
                                <div className={`font-medium ${canAccess ? "text-white" : "text-gray-500"}`}>
                                  {tool.name}
                                </div>
                                <div className="text-xs text-gray-400 capitalize">{category}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {!canAccess && <Lock className="w-4 h-4 text-gray-500" />}
                              <Button
                                onClick={() => canAccess && handleToolToggle(tool.id, showToolsModal.id)}
                                disabled={!canAccess}
                                size="sm"
                                className={
                                  hasAccess
                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                    : "bg-green-600 hover:bg-green-700 text-white"
                                }
                              >
                                {hasAccess ? "Remove" : "Add"}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              <div className="flex justify-end pt-4 border-t border-gray-700">
                <Button
                  onClick={() => setShowToolsModal(null)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Selesai
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span>Konfirmasi Hapus</span>
              </CardTitle>
              <CardDescription>
                Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setShowDeleteConfirm(null)}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Batal
                </Button>
                <Button
                  onClick={() => handleDeleteUser(showDeleteConfirm)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus User
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
