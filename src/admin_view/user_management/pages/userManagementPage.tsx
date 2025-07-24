"use client"

import { useState, useEffect } from "react"
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
  Search,
  Filter,
  Settings,
  User,
  Lock,
  Calendar,
  Activity,
  FileText,
  TrendingUp,
  Factory,
  AlertTriangle,
  Check,
  Shield,
  UserCheck,
  Briefcase,
  MoreHorizontal,
  Eye,
  EyeOff,
  Key,
  LogOut,
} from "lucide-react"
import { AuthService, UserToolsService } from "../../../services/API_Services"
import { useAuth } from "../../../main_view/contexts/AuthContext" // Import AuthContext

interface UserData {
  id: number
  nama: string
  nip: string
  role: "admin" | "user" | "PIC" | "Supervisor" | "Produksi"
  tools: string[]
  createdAt: string
  updatedAt?: string
  status?: string
}

interface Tool {
  id: string
  name: string
  category: string
  icon: any
  requiresRole?: string[]
}

type RoleType = "admin" | "user" | "PIC" | "Supervisor" | "Produksi"

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userCount, setUserCount] = useState({ adminCount: 0, userCount: 0 })
  
  // Menggunakan AuthContext untuk mendapatkan data admin yang login
  const { user: loggedInUser, handleLogout: authLogout } = useAuth()

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [showToolsModal, setShowToolsModal] = useState<UserData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [showPassword, setShowPassword] = useState(false)
  const [changePassword, setChangePassword] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    password: "",
    role: "user" as RoleType,
    tools: [] as string[],
  })

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError(null)
      try {
        const userData = await AuthService.getAllUsers()
        // Map backend user data to frontend format
        const mappedUsers = userData.map((user) => ({
          id: user.id,
          nama: user.nama,
          nip: user.nip,
          role: user.role as "admin" | "user",
          tools: [], // Initialize with empty tools array
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          status: user.status
        }))
        setUsers(mappedUsers)
        
        // Fetch user count
        const countData = await AuthService.getUserCount()
        setUserCount(countData)
        
        // Fetch tools for each user
        mappedUsers.forEach(async (user) => {
          try {
            const toolsData = await UserToolsService.getUserTools(user.id)
            if (toolsData && toolsData.tools) {
              const userTools = toolsData.tools.map(tool => tool.toolName)
              setUsers(prevUsers => 
                prevUsers.map(u => 
                  u.id === user.id ? { ...u, tools: userTools } : u
                )
              )
            }
          } catch (err) {
            console.error(`Error fetching tools for user ${user.id}:`, err)
          }
        })
      } catch (err) {
        console.error("Error fetching users:", err)
        setError(err instanceof Error ? err.message : "Gagal memuat data pengguna")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Tambahkan useEffect untuk mengisi formData saat editingUser berubah
  useEffect(() => {
    if (editingUser) {
      setFormData({
        nama: editingUser.nama,
        nip: editingUser.nip,
        password: "", // password selalu kosong saat edit
        role: editingUser.role,
        tools: editingUser.tools,
      })
      setChangePassword(false)
      setShowPassword(false)
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
    if (!formData.nama.trim()) errors.nama = "Nama harus diisi"
    if (!formData.nip.trim()) errors.nip = "NIP harus diisi"
    // Password hanya required saat tambah user atau saat change password di edit
    if (!editingUser && !formData.password.trim()) errors.password = "Password harus diisi"
    if (!editingUser && formData.password.length < 6) errors.password = "Password minimal 6 karakter"
    if (editingUser && changePassword && !formData.password.trim()) errors.password = "Password harus diisi"
    if (editingUser && changePassword && formData.password.length < 6) errors.password = "Password minimal 6 karakter"
    const existingUser = users.find((u) => u.nip === formData.nip && u.id !== editingUser?.id)
    if (existingUser) errors.nip = "NIP sudah digunakan"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = () => {
    setFormData({
      nama: "",
      nip: "",
      password: "",
      role: "user",
      tools: [],
    })
    setFormErrors({})
    setChangePassword(false)
    setShowPassword(false)
  }
  const handleAddUser = async () => {
    if (!validateForm()) return
    try {
      setLoading(true)
      const userData = {
        nama: formData.nama,
        nip: formData.nip,
        password: formData.password,
        role: formData.role
      }
      
      const newUser = await AuthService.createUser(userData)
      
      // Add the new user to the state
      const userWithTools = {
        ...newUser,
        tools: []
      }
      
      setUsers([...users, userWithTools])
      setShowAddForm(false)
      resetForm()
      alert("Berhasil menambahkan pengguna")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menambahkan pengguna")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!validateForm() || !editingUser) return
    try {
      setLoading(true)
      const userData = {
        nama: formData.nama,
        nip: formData.nip,
        role: formData.role
      }
      
      // Only include password if it's being changed
      if (changePassword && formData.password) {
        userData.password = formData.password
      }
      
      const updatedUser = await AuthService.updateUser(editingUser.id, userData)
      
      // Update the user in state
      setUsers(
        users.map((user) =>
          user.id === editingUser.id
            ? {
                ...updatedUser,
                role: updatedUser.role as "admin" | "user", // Cast role to expected type
                tools: user.tools, // Preserve existing tools
              }
            : user
        )
      )
      
      setEditingUser(null)
      resetForm()
      alert("Berhasil mengupdate user")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memperbarui pengguna")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    try {
      setLoading(true)
      await AuthService.deleteUser(userId)
      setUsers(users.filter((user) => user.id !== userId))
      setShowDeleteConfirm(null)
      alert("Berhasil menghapus user")
    } catch (err) {
      console.error("Error deleting user:", err)
      alert(err instanceof Error ? err.message : "Gagal menghapus pengguna")
    } finally {
      setLoading(false)
    }
  }

  const handleToolToggle = async (toolId: string, userId?: number) => {
    if (userId) {
      // Toggle tool untuk user yang sudah ada
      try {
        setLoading(true)
        const user = users.find((u) => u.id === userId)
        if (!user) return
        
        if (user.tools.includes(toolId)) {
          // Remove tool
          await UserToolsService.removeUserTool(userId, toolId)
          const newTools = user.tools.filter((t) => t !== toolId)
          setUsers(users.map((user) => (user.id === userId ? { ...user, tools: newTools } : user)))
          if (showToolsModal && showToolsModal.id === userId) {
            setShowToolsModal({ ...showToolsModal, tools: newTools })
          }
          alert("Akses tool berhasil dihapus")
        } else {
          // Add tool
          await UserToolsService.addUserTool(userId, toolId)
          const newTools = [...user.tools, toolId]
          setUsers(users.map((user) => (user.id === userId ? { ...user, tools: newTools } : user)))
          if (showToolsModal && showToolsModal.id === userId) {
            setShowToolsModal({ ...showToolsModal, tools: newTools })
          }
          alert("Akses tool berhasil ditambahkan")
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : "Gagal mengubah akses tool")
      } finally {
        setLoading(false)
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
      case "PIC":
        return "lime"
      case "Supervisor":
        return "zinc"
      case "Produksi":
        return "orange" 
      default:
        return "default"
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

  // Update handleLogout function to use AuthContext
  const handleLogout = () => {
    authLogout()
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Professional Dark Header */}
      <header className="bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Left side - Title and description */}
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">User Management</h1>
                <p className="text-sm text-gray-400">Kelola pengguna dan akses sistem</p>
              </div>
              <Badge variant="warning" className="ml-4">
                <Shield className="w-3 h-3 mr-1" />
                Admin Only
              </Badge>
            </div>

            {/* Right side - Admin info and logout */}
            <div className="flex items-center">
              {/* Logged-in Admin Info with integrated logout */}
              <div className="flex items-center bg-gray-800/70 px-4 py-3 rounded-xl border border-gray-700 shadow-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md mr-3">
                  {loggedInUser?.nama?.slice(0, 1).toUpperCase() || "A"}
                </div>
                <div className="mr-4">
                  <p className="text-sm font-semibold text-white">{loggedInUser?.nama || "Admin"}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">NIP: {loggedInUser?.nip || ""}</span>
                    <Badge variant="warning" className="text-xs py-0 px-2">
                      Administrator
                    </Badge>
                  </div>
                </div>
                <div className="border-l border-gray-600 pl-4">
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    <span className="text-red-400">Logout</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professional Dark Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-white">{userCount.adminCount + userCount.userCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-600 rounded-xl shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Administrators</p>
                  <p className="text-2xl font-bold text-white">{userCount.adminCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-600 rounded-xl shadow-lg">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Regular Users</p>
                  <p className="text-2xl font-bold text-white">{userCount.userCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Available Tools</p>
                  <p className="text-2xl font-bold text-white">{availableTools.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Professional Dark Search and Filter */}
        <Card className="mb-8 bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama atau NIP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  >
                    <option value="all">Semua Role</option>
                    <option value="PIC">PIC</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Produksi">Produksi</option>
                  </select>
                </div>
              </div>

              {/* Add User Button */}
              <div className="flex justify-end">
                <Button onClick={() => setShowAddForm(true)} variant="primary" size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah User Baru
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Dark Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user, index) => (
            <Card
              key={user.id}
              className="bg-gray-800 border-gray-700 hover:shadow-2xl hover:border-gray-600 transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex items-start gap-4">
                    {/* Professional Dark Avatar */}
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {user.nama.slice(0, 1).toUpperCase()}
                      </div>
                      {user.role === "admin" && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                          <Shield className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{user.nama}</h3>
                        <Badge variant={getRoleColor(user.role)}>
                          {user.role === "admin" ? "Administrator" : user.role}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                        <div className="flex items-center gap-1 bg-gray-700/50 px-3 py-1 rounded-lg">
                          <span className="font-medium text-gray-300">NIP:</span>
                          <span>{user.nip}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-700/50 px-3 py-1 rounded-lg">
                          <Calendar className="w-4 h-4" />
                          <span>Created: {user.createdAt}</span>
                        </div>
                        {user.updatedAt && (
                          <div className="flex items-center gap-1 bg-gray-700/50 px-3 py-1 rounded-lg">
                            <Edit className="w-4 h-4" />
                            <span>Updated: {user.updatedAt}</span>
                          </div>
                        )}
                      </div>

                      {/* Professional Dark Tools Display */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Settings className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-300">Assigned Tools:</span>
                          <Badge variant="default" className="text-xs">
                            {user.tools.length} tools
                          </Badge>
                        </div>

                        {user.tools.length === 0 ? (
                          <div className="text-sm text-gray-500 italic bg-gray-700/30 px-3 py-2 rounded-lg border border-gray-600">
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
                                  className="flex items-center gap-2 bg-blue-900/30 border border-blue-700/50 px-3 py-1 rounded-lg text-sm text-blue-300"
                                >
                                  <IconComponent className="w-3 h-3" />
                                  <span>{tool.name}</span>
                                </div>
                              )
                            })}
                            {user.tools.length > 4 && (
                              <div className="flex items-center gap-1 bg-gray-700/50 border border-gray-600 px-3 py-1 rounded-lg text-sm text-gray-400">
                                <MoreHorizontal className="w-3 h-3" />
                                {user.tools.length - 4} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Professional Dark Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 lg:items-center">
                    <Button onClick={() => setShowToolsModal(user)} variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Tools
                    </Button>
                    <Button onClick={() => setEditingUser(user)} variant="secondary" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button onClick={() => setShowDeleteConfirm(user.id)} variant="danger" size="sm">
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
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Tidak ada user ditemukan</h3>
              <p className="text-gray-400 mb-6">Coba ubah filter pencarian atau tambah user baru</p>
              <Button onClick={() => setShowAddForm(true)} variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Tambah User Pertama
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Enhanced Add/Edit User Modal */}
      {(showAddForm || editingUser) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span>{editingUser ? "Edit User" : "Tambah User Baru"}</span>
              </CardTitle>
              <CardDescription>
                {editingUser
                  ? "Ubah informasi user dan tools yang dapat diakses"
                  : "Buat akun user baru dengan role dan tools yang sesuai"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${formErrors.nama ? "border-red-500" : "border-gray-600"}`}
                    placeholder="Masukkan nama lengkap"
                  />
                  {formErrors.nama && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {formErrors.nama}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">NIP</label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${formErrors.nip ? "border-red-500" : "border-gray-600"}`}
                    placeholder="Masukkan NIP"
                  />
                  {formErrors.nip && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {formErrors.nip}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role User</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as RoleType })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <option value="PIC">PIC</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Produksi">Produksi</option>
                </select>
              </div>

              {/* Enhanced Password Section */}
              <div className="space-y-4">
                {/* Password field for new user */}
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`w-full px-3 py-2 pr-10 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${formErrors.password ? "border-red-500" : "border-gray-600"}`}
                        placeholder="Masukkan password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {formErrors.password && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {formErrors.password}
                      </p>
                    )}
                  </div>
                )}

                {/* Enhanced Password section for editing user */}
                {editingUser && (
                  <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-gray-400" />
                        <label className="text-sm font-medium text-gray-300">Password</label>
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          setChangePassword(!changePassword)
                          if (!changePassword) {
                            setFormData({ ...formData, password: "" })
                          }
                        }}
                        variant={changePassword ? "danger" : "outline"}
                        size="sm"
                      >
                        {changePassword ? (
                          <>
                            <X className="w-3 h-3 mr-1" />
                            Batal
                          </>
                        ) : (
                          <>
                            <Edit className="w-3 h-3 mr-1" />
                            Ubah Password
                          </>
                        )}
                      </Button>
                    </div>

                    {!changePassword ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800/50 px-3 py-2 rounded-lg">
                        <Lock className="w-4 h-4" />
                        <span>Password tidak akan diubah</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className={`w-full px-3 py-2 pr-10 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${formErrors.password ? "border-red-500" : "border-gray-600"}`}
                            placeholder="Masukkan password baru"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors duration-200"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {formErrors.password && (
                          <p className="text-red-400 text-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {formErrors.password}
                          </p>
                        )}
                        <div className="text-xs text-gray-400 bg-blue-900/20 border border-blue-700/30 px-3 py-2 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <AlertTriangle className="w-3 h-3 text-blue-400" />
                            <span className="font-medium text-blue-400">Persyaratan Password:</span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Minimal 6 karakter</li>
                            <li>Kombinasi huruf dan angka direkomendasikan</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
                <Button
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingUser(null)
                    resetForm()
                  }}
                  variant="outline"
                >
                  <X className="w-4 h-4 mr-2" />
                  Batal
                </Button>
                <Button onClick={editingUser ? handleUpdateUser : handleAddUser} variant="primary">
                  <Save className="w-4 h-4 mr-2" />
                  {editingUser ? "Update User" : "Tambah User"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Professional Dark Tools Management Modal */}
      {showToolsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <span>Manage Tools - {showToolsModal.nama}</span>
              </CardTitle>
              <CardDescription>Kelola tools yang dapat diakses oleh user ini</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {showToolsModal.tools.length === 0 && (
                <div className="text-center py-12 bg-gray-700/30 rounded-lg border border-gray-600">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <span className="text-lg text-gray-300">Belum ada tools yang diassign untuk user ini.</span>
                </div>
              )}
              {Object.entries(getToolsByCategory(availableTools.map((t) => t.id))).map(([category, tools]) => {
                if (tools.length === 0) return null
                return (
                  <div key={category} className="bg-gray-700/30 rounded-lg p-6 border border-gray-600">
                    <h4 className="text-lg font-semibold text-white mb-4 capitalize flex items-center space-x-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Factory className="w-4 h-4 text-white" />
                      </div>
                      <span>{category} Tools</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tools.map((tool) => {
                        const canAccess = canUserAccessTool(showToolsModal.role, tool)
                        const hasAccess = showToolsModal.tools.includes(tool.id)
                        const IconComponent = tool.icon

                        return (
                          <div
                            key={tool.id}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                              !canAccess
                                ? "bg-gray-800/50 border-gray-600 opacity-50"
                                : hasAccess
                                  ? "bg-green-900/30 border-green-700"
                                  : "bg-gray-800 border-gray-600 hover:border-gray-500"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${hasAccess ? "bg-green-900/50" : "bg-gray-700"}`}>
                                <IconComponent
                                  className={`w-5 h-5 ${hasAccess ? "text-green-400" : "text-gray-400"}`}
                                />
                              </div>
                              <div>
                                <div className={`font-medium ${canAccess ? "text-white" : "text-gray-500"}`}>
                                  {tool.name}
                                </div>
                                <div className="text-xs text-gray-400 capitalize flex items-center gap-1">
                                  <span>{category}</span>
                                  {hasAccess && <Check className="w-3 h-3 text-green-400" />}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {!canAccess && <Lock className="w-4 h-4 text-gray-500" />}
                              <Button
                                onClick={() => canAccess && handleToolToggle(tool.id, showToolsModal.id)}
                                disabled={!canAccess}
                                size="sm"
                                variant={hasAccess ? "danger" : "primary"}
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

              <div className="flex justify-end pt-6 border-t border-gray-700">
                <Button onClick={() => setShowToolsModal(null)} variant="primary">
                  <Check className="w-4 h-4 mr-2" />
                  Selesai
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Professional Dark Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-gray-800 border-gray-700">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-red-600 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <span>Konfirmasi Hapus</span>
              </CardTitle>
              <CardDescription>
                Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-end space-x-3">
                <Button onClick={() => setShowDeleteConfirm(null)} variant="outline">
                  Batal
                </Button>
                <Button onClick={() => handleDeleteUser(showDeleteConfirm)} variant="danger">
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
