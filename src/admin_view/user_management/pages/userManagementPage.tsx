"use client"

import { useState, useEffect } from "react"
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
  Crown,    // Tambahkan impor ini
  UserCheck, // Tambahkan impor ini
  Zap       // Tambahkan impor ini
} from "lucide-react"
import { useAuth } from "../../../main_view/contexts/AuthContext"
import { AuthService, UserToolsService, UserData as ApiUserData, UserRequest } from "../../../services/API_Services"

interface UserData {
  id: string
  nama: string
  nip: string
  role: 'admin' | 'user'
  tools: string[]
  createdAt: string
  updatedAt?: string
}

interface Tool {
  id: string
  name: string
  category: string
  icon: any
  requiresRole?: string[]
}

type RoleType = 'admin' | 'user'

export default function UserManagementPage() {
  const { handleLogout } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [availableTools] = useState<Tool[]>([
    { id: "scheduler", name: "Planning System", category: "planning", icon: Calendar },
    { id: "reports", name: "Laporan Produksi", category: "reporting", icon: FileText },
    { id: "analytics", name: "Analytics Dashboard", category: "analytics", icon: TrendingUp },
    { id: "usermanagement", name: "User Management", category: "admin", icon: Users, requiresRole: ["admin"] },
    { id: "systemconfig", name: "System Config", category: "admin", icon: Settings, requiresRole: ["admin"] },
    { id: "monitoring", name: "Real-time Monitor", category: "monitoring", icon: Activity },
  ])

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showToolsModal, setShowToolsModal] = useState<UserData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})
  const [changePassword, setChangePassword] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    password: '',
    role: 'user' as RoleType,
    tools: [] as string[],
  })

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  // Tambahkan useEffect untuk mengisi formData saat editingUser berubah
  useEffect(() => {
    if (editingUser) {
      setFormData({
        nama: editingUser.nama,
        nip: editingUser.nip,
        password: '', // password selalu kosong saat edit
        role: editingUser.role,
        tools: editingUser.tools,
      })
      setChangePassword(false)
    }
  }, [editingUser])

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nip.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const validateForm = () => {
    const errors: { [key: string]: string } = {}
    if (!formData.nama.trim()) errors.nama = 'Nama harus diisi'
    if (!formData.nip.trim()) errors.nip = 'NIP harus diisi'
    // Password hanya required saat tambah user
    if (!editingUser && !formData.password.trim()) errors.password = 'Password harus diisi'
    if (!editingUser && formData.password.length < 6) errors.password = 'Password minimal 6 karakter'
    const existingUser = users.find((u) => u.nip === formData.nip && u.id !== editingUser?.id)
    if (existingUser) errors.nip = 'NIP sudah digunakan'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = () => {
    setFormData({
      nama: '',
      nip: '',
      password: '',
      role: 'user',
      tools: [],
    })
    setFormErrors({})
  }

  const getDefaultToolsForRole = (role: RoleType): string[] => {
    if (role === 'admin') return availableTools.map((tool) => tool.id)
    return availableTools.filter((tool) => tool.category !== 'admin').map((tool) => tool.id)
  }

  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const apiUsers = await AuthService.getAllUsers()
        const transformedUsers = apiUsers.map((apiUser: any) => ({
          id: apiUser.id.toString(),
          nama: apiUser.nama,
          nip: apiUser.nip,
          role: apiUser.role as RoleType,
          tools: [],
          createdAt: apiUser.createdAt,
          updatedAt: apiUser.updatedAt,
        }))
        for (const user of transformedUsers) {
          try {
            const toolsResponse = await UserToolsService.getUserTools(parseInt(user.id))
            user.tools = toolsResponse.tools.map((tool: any) => tool.toolName)
          } catch (toolError) {
            console.error(`Error fetching tools for user ${user.id}:`, toolError)
          }
        }
        setUsers(transformedUsers)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data pengguna')
      } finally {
        setLoading(false)
      }
    }
    
    fetchUsers()
  }, [])

  const handleAddUser = async () => {
    if (!validateForm()) return
    try {
      const userRequest = {
        nama: formData.nama,
        nip: formData.nip,
        password: formData.password,
        role: 'user',
      }
      const newApiUser = await AuthService.createUser(userRequest)
      // Tidak assign tools apapun saat create user
      const newUser: UserData = {
        id: newApiUser.id.toString(),
        nama: newApiUser.nama,
        nip: newApiUser.nip,
        role: newApiUser.role as RoleType,
        tools: [],
        createdAt: newApiUser.createdAt,
        updatedAt: newApiUser.updatedAt,
      }
      setUsers([...users, newUser])
      setShowAddForm(false)
      resetForm()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menambahkan pengguna')
    }
  }

  const handleUpdateUser = async () => {
    if (!validateForm() || !editingUser) return
    try {
      const userRequest: any = {
        nama: formData.nama,
        nip: formData.nip,
        role: formData.role,
      }
      if (formData.password !== '••••••••') userRequest.password = formData.password
      const updatedApiUser = await AuthService.updateUser(parseInt(editingUser.id), userRequest)
      let currentTools: string[] = []
      try {
        const toolsResponse = await UserToolsService.getUserTools(parseInt(editingUser.id))
        currentTools = toolsResponse.tools.map((tool: any) => tool.toolName)
      } catch (err) {
        // Jangan blokir update user jika gagal get tools, cukup warning di console
        console.warn('Gagal mendapatkan tools pengguna setelah update user:', err)
        currentTools = formData.tools // fallback ke form
      }
      const toolsToAdd = formData.tools.filter((tool) => !currentTools.includes(tool))
      const toolsToRemove = currentTools.filter((tool) => !formData.tools.includes(tool))
      for (const toolName of toolsToAdd) {
        try { await UserToolsService.addUserTool(parseInt(editingUser.id), toolName) } catch {}
      }
      for (const toolName of toolsToRemove) {
        try { await UserToolsService.removeUserTool(parseInt(editingUser.id), toolName) } catch {}
      }
      setUsers(users.map((user) => user.id === editingUser.id ? {
        ...user,
        nama: formData.nama,
        nip: formData.nip,
        role: formData.role,
        tools: formData.tools,
      } : user))
      setEditingUser(null)
      resetForm()
      alert('Berhasil mengupdate user')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal memperbarui pengguna')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      // Call API to delete user
      await AuthService.deleteUser(parseInt(userId))
      
      // Update state
      setUsers(users.filter((user) => user.id !== userId))
      setShowDeleteConfirm(null)
    } catch (err) {
      console.error('Error deleting user:', err)
      alert(err instanceof Error ? err.message : 'Gagal menghapus pengguna')
    }
  }

  const handleToolToggle = async (toolId: string, userId?: string) => {
    if (userId) {
      // Toggle tool untuk user yang sudah ada
      try {
        const user = users.find(u => u.id === userId)
        if (!user) return
        if (user.tools.includes(toolId)) {
          // Remove tool
          await UserToolsService.removeUserTool(parseInt(userId), toolId)
          // Setelah remove, refetch tools user dari API
          const toolsResponse = await UserToolsService.getUserTools(parseInt(userId))
          const newTools = toolsResponse.tools.map((tool: any) => tool.toolName)
          setUsers(
            users.map((user) =>
              user.id === userId
                ? { ...user, tools: newTools }
                : user,
            ),
          )
          if (showToolsModal && showToolsModal.id === userId) {
            setShowToolsModal({ ...showToolsModal, tools: newTools })
          }
          alert('Akses tool berhasil dihapus')
        } else {
          // Cek dulu, jangan kirim request jika sudah ada
          if (!user.tools.includes(toolId)) {
            await UserToolsService.addUserTool(parseInt(userId), toolId)
          }
          // Setelah add, refetch tools user dari API
          const toolsResponse = await UserToolsService.getUserTools(parseInt(userId))
          const newTools = toolsResponse.tools.map((tool: any) => tool.toolName)
          setUsers(
            users.map((user) =>
              user.id === userId
                ? { ...user, tools: newTools }
                : user,
            ),
          )
          if (showToolsModal && showToolsModal.id === userId) {
            setShowToolsModal({ ...showToolsModal, tools: newTools })
          }
        }
      } catch (err: any) {
        // Tampilkan pesan error detail dari backend jika ada
        alert(err?.message || 'Gagal mengubah akses tool')
      }
    } else {
      // Toggle tool di form (belum simpan ke backend)
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
        return "bg-orange-500/20 text-orange-300 border-orange-500/30"
      case "planner":
        return "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30"
      case "operator":
        return "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30"
      default:
        return "bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-300 border-gray-500/30"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Header with enhanced gradient */}
      <header className="border-b border-gray-800/50 bg-gradient-to-r from-gray-900/80 via-gray-800/60 to-gray-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    User Management
                  </h1>
                  <p className="text-xs text-gray-400">Kelola pengguna dan akses sistem</p>
                </div>
                <Badge className="bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border border-red-500/30 px-2 py-0.5">
                  <Crown className="w-3 h-3 mr-1" />
                  Admin Only
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-sm px-3 py-1.5"
              >
                <Plus className="w-3 h-3 mr-2" />
                Tambah User
              </Button>

              <Button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 rounded-lg hover:from-gray-600 hover:to-gray-700 hover:text-white transition-all duration-300 shadow-lg text-sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full">
                  <Users className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-1">
                {users.length}
              </div>
              <div className="text-gray-400 text-xs font-medium">Total Users</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/20 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-full">
                  <Crown className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mb-1">
                {users.filter((u) => u.role === "admin").length}
              </div>
              <div className="text-gray-400 text-sm font-medium">Administrators</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-1">
                {users.filter((u) => u.role === "user").length}
              </div>
              <div className="text-gray-400 text-sm font-medium">Regular Users</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/20 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent mb-1">
                {availableTools.length}
              </div>
              <div className="text-gray-400 text-sm font-medium">Available Tools</div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search and Filter */}
        <Card className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 border-gray-600/50 backdrop-blur-sm mb-8 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama atau NIP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm"
                />
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-gray-700/30 px-4 py-3 rounded-xl border border-gray-600/50">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-transparent text-white focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-gray-800">
                      Semua Role
                    </option>
                    <option value="admin" className="bg-gray-800">
                      Administrator
                    </option>
                    <option value="user" className="bg-gray-800">
                      User
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Users List */}
        <div className="space-y-6">
          {filteredUsers.map((user, index) => (
            <Card
              key={user.id}
              className="bg-gradient-to-r from-gray-800/70 to-gray-700/70 border border-gray-600/50 shadow-xl rounded-2xl backdrop-blur-sm hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] hover:border-gray-500/50"
            >
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex items-start gap-6">
                    {/* Enhanced Avatar */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl ring-4 ring-blue-500/20">
                        {user.nama.slice(0, 1).toUpperCase()}
                      </div>
                      {user.role === "admin" && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                          {user.nama}
                        </h3>
                        <Badge className={`${getRoleColor(user.role)} px-3 py-1 font-medium shadow-lg border`}>
                          {user.role === "admin" && <Crown className="w-3 h-3 mr-1" />}
                          {user.role === "user" && <User className="w-3 h-3 mr-1" />}
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-4">
                        <div className="flex items-center gap-1 bg-gray-700/30 px-3 py-1 rounded-lg">
                          <span className="font-medium text-gray-300">NIP:</span>
                          <span>{user.nip}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-700/30 px-3 py-1 rounded-lg">
                          <Calendar className="w-3 h-3" />
                          <span>{user.createdAt}</span>
                        </div>
                        {user.updatedAt && (
                          <div className="flex items-center gap-1 bg-gray-700/30 px-3 py-1 rounded-lg">
                            <Edit className="w-3 h-3" />
                            <span>{user.updatedAt}</span>
                          </div>
                        )}
                      </div>

                      {/* Enhanced Tools Display */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Settings className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-sm text-gray-300">Assigned Tools:</span>
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                            {user.tools.length} tools
                          </Badge>
                        </div>

                        {user.tools.length === 0 ? (
                          <div className="flex items-center gap-2 text-xs text-gray-500 italic bg-gray-700/20 px-3 py-2 rounded-lg border border-gray-600/30">
                            <AlertTriangle className="w-3 h-3" />
                            Belum ada tools yang diassign
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {user.tools.slice(0, 4).map((toolId) => {
                              const tool = availableTools.find((t) => t.id === toolId)
                              if (!tool) return null
                              const IconComponent = tool.icon
                              return (
                                <div
                                  key={toolId}
                                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 px-3 py-2 rounded-xl text-xs text-blue-200 font-medium shadow-lg backdrop-blur-sm hover:from-blue-600/30 hover:to-indigo-600/30 transition-all duration-300"
                                >
                                  <IconComponent className="w-3 h-3" />
                                  <span>{tool.name}</span>
                                </div>
                              )
                            })}
                            {user.tools.length > 4 && (
                              <div className="flex items-center gap-1 bg-gray-700/40 border border-gray-600/40 px-3 py-2 rounded-xl text-xs text-gray-400 font-medium">
                                <Plus className="w-3 h-3" />
                                {user.tools.length - 4} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
                    <Button
                      onClick={() => setShowToolsModal(user)}
                      variant="outline"
                      size="sm"
                      className="border-blue-500/50 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400 transition-all duration-300 shadow-lg backdrop-blur-sm"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Tools
                    </Button>
                    <Button
                      onClick={() => setEditingUser(user)}
                      variant="outline"
                      size="sm"
                      className="border-green-500/50 text-green-300 hover:bg-green-500/20 hover:border-green-400 transition-all duration-300 shadow-lg backdrop-blur-sm"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => setShowDeleteConfirm(user.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-300 hover:bg-red-500/20 hover:border-red-400 transition-all duration-300 shadow-lg backdrop-blur-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card className="bg-gradient-to-br from-gray-800/60 to-gray-700/60 border-gray-600/50 backdrop-blur-sm shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-300 mb-3">Tidak ada user ditemukan</h3>
              <p className="text-gray-400 mb-6">Coba ubah filter pencarian atau tambah user baru</p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah User Pertama
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {(showAddForm || editingUser) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="bg-gradient-to-br from-gray-800/90 to-gray-700/90 border-gray-600/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl shadow-2xl">
            <CardHeader className="border-b border-gray-600/50">
              <CardTitle className="text-white flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl">{editingUser ? "Edit User" : "Tambah User Baru"}</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                {editingUser
                  ? "Ubah informasi user dan tools yang dapat diakses"
                  : "Buat akun user baru dengan role dan tools yang sesuai"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm ${formErrors.nama ? "border-red-500" : "border-gray-600/50"}`}
                    placeholder="Masukkan nama lengkap"
                  />
                  {formErrors.nama && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {formErrors.nama}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">NIP</label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm ${formErrors.nip ? "border-red-500" : "border-gray-600/50"}`}
                    placeholder="Masukkan NIP"
                  />
                  {formErrors.nip && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {formErrors.nip}
                    </p>
                  )}
                </div>
              </div>

              {/* Password field for new user */}
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm ${formErrors.password ? "border-red-500" : "border-gray-600/50"}`}
                    placeholder="Masukkan password"
                  />
                  {formErrors.password && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {formErrors.password}
                    </p>
                  )}
                </div>
              )}

              {/* Password field for editing user */}
              {editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Password</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`flex-1 px-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm ${formErrors.password ? "border-red-500" : "border-gray-600/50"}`}
                      placeholder="Kosongkan jika tidak ingin mengubah password"
                      readOnly={!changePassword}
                    />
                    <Button
                      type="button"
                      onClick={() => setChangePassword((prev) => !prev)}
                      className={`px-4 py-3 rounded-xl transition-all duration-300 ${changePassword ? "bg-gray-600 hover:bg-gray-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                    >
                      {changePassword ? "Batal" : "Change Password"}
                    </Button>
                  </div>
                  {formErrors.password && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {formErrors.password}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-600/50">
                <Button
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingUser(null)
                    resetForm()
                  }}
                  variant="outline"
                  className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50 px-6 py-3 rounded-xl transition-all duration-300"
                >
                  <X className="w-4 h-4 mr-2" />
                  Batal
                </Button>
                <Button
                  onClick={editingUser ? handleUpdateUser : handleAddUser}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 py-3 rounded-xl shadow-lg transition-all duration-300"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <Card className="bg-gradient-to-br from-gray-800/90 to-gray-700/90 border-gray-600/50 w-full max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-xl shadow-2xl">
            <CardHeader className="border-b border-gray-600/50">
              <CardTitle className="text-white flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl">Manage Tools - {showToolsModal.nama}</span>
              </CardTitle>
              <CardDescription className="text-gray-400">Kelola tools yang dapat diakses oleh user ini</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {showToolsModal.tools.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <span>Belum ada tools yang diassign untuk user ini.</span>
                </div>
              )}
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

              <div className="flex justify-end pt-4 border-t border-gray-600/50">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <Card className="bg-gradient-to-br from-gray-800/90 to-gray-700/90 border-red-500/30 w-full max-w-md backdrop-blur-xl shadow-2xl">
            <CardHeader className="border-b border-gray-600/50">
              <CardTitle className="text-white flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl">Konfirmasi Hapus</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-end space-x-4">
                <Button
                  onClick={() => setShowDeleteConfirm(null)}
                  variant="outline"
                  className="border-gray-600/50 text-gray-300 hover:bg-gray-700"
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
