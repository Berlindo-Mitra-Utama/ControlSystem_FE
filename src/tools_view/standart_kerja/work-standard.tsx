"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "../../main_view/contexts/AuthContext"
import {
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  X,
  Clock,
  Users,
  Settings,
  Zap,
  BarChart3,
  Factory,
  ChevronRight,
  LogOut,
  User,
  BadgeIcon as IdCard,
} from "lucide-react"

interface WorkItem {
  no: number
  itemPekerjaan: string
  lostTime: number
  manualManpower: number
  autoPositioner: number
  prosesWeld: number
}

interface TSKProgram {
  id: string
  name: string
  items: WorkItem[]
}

const tskPrograms: TSKProgram[] = [
  {
    id: "jig-a1-star-1",
    name: "PROGRAM NO 1- (JIG A1) STAR",
    items: [
      {
        no: 1,
        itemPekerjaan: "Tekan pust bottom star",
        lostTime: 0,
        manualManpower: 1.0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 2,
        itemPekerjaan: "Robot beroperasi-mendekatai assy part jig-A1",
        lostTime: 0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 3,
        itemPekerjaan: "Robot memproses welding assy part jig-A1",
        lostTime: 0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
    ],
  },
  {
    id: "prepare-jig-b2",
    name: "PREPARE JIG-B2",
    items: [
      {
        no: 4,
        itemPekerjaan: "Operator pindah ke jig-B2",
        lostTime: 0,
        manualManpower: 1.0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 5,
        itemPekerjaan: "Buka clamping jig-B2",
        lostTime: 1.0,
        manualManpower: 0,
        autoPositioner: 5.0,
        prosesWeld: 0,
      },
      {
        no: 6,
        itemPekerjaan: "Ambil part finis proses di jig-B2",
        lostTime: 1.0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 7,
        itemPekerjaan: "Penyimpanan part finis proses ke box standar",
        lostTime: 1.0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 8,
        itemPekerjaan: "Pengambilan Wip chil part dan tempatkan di jig-B2",
        lostTime: 1.0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 9,
        itemPekerjaan: "Tekan pust bottom clamping part",
        lostTime: 3.0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
    ],
  },
  {
    id: "jig-a1-finis",
    name: "PROGRAM NO 1- (JIG A1) FINIS",
    items: [
      {
        no: 10,
        itemPekerjaan: "Robot finis proses welding jig-A1 menjauh dari produck",
        lostTime: 0,
        manualManpower: 1.0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 11,
        itemPekerjaan: "Positioner / rotari berputar mengeluarkan jig-A1 & memposisikan jig-B1",
        lostTime: 0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
    ],
  },
  {
    id: "jig-a2-star",
    name: "PROGRAM NO-1 (JIG A2) STAR",
    items: [
      {
        no: 12,
        itemPekerjaan: "Robot beroperasi-mendekatai assy part jig-A2",
        lostTime: 0,
        manualManpower: 4.0,
        autoPositioner: 1.0,
        prosesWeld: 0,
      },
      {
        no: 13,
        itemPekerjaan: "Robot memproses welding assy part jig-A2",
        lostTime: 0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
    ],
  },
  {
    id: "prepare-jig-b1",
    name: "PREPARE JIG-B1",
    items: [
      {
        no: 14,
        itemPekerjaan: "Operator pindah ke jig-B1",
        lostTime: 0,
        manualManpower: 1.0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 15,
        itemPekerjaan: "Buka clamping jig-B1",
        lostTime: 1.0,
        manualManpower: 0,
        autoPositioner: 5.0,
        prosesWeld: 0,
      },
      {
        no: 16,
        itemPekerjaan: "Ambil part finis proses di jig-B1",
        lostTime: 1.0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 17,
        itemPekerjaan: "Penyimpanan part finis proses ke box standar",
        lostTime: 1.0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 18,
        itemPekerjaan: "Pengambilan Wip chil part dan tempatkan di jig-B1",
        lostTime: 3.0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 19,
        itemPekerjaan: "Tekan pust bottom clamping part",
        lostTime: 1.0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
    ],
  },
  {
    id: "jig-a2-finis",
    name: "PROGRAM NO-1 (JIG A2) FINIS",
    items: [
      {
        no: 20,
        itemPekerjaan: "Robot finis proses welding jig-A2 menjauh dari produck",
        lostTime: 0,
        manualManpower: 1.0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 21,
        itemPekerjaan: "Positioner / rotari berputar mengeluarkan jig-A2 & memposisikan jig-A1",
        lostTime: 0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
    ],
  },
  {
    id: "jig-b2-star",
    name: "PROGRAM NO-2 (JIG B2) STAR",
    items: [
      {
        no: 22,
        itemPekerjaan: "Tekan pust bottom star",
        lostTime: 0,
        manualManpower: 4.0,
        autoPositioner: 1.0,
        prosesWeld: 0,
      },
      {
        no: 23,
        itemPekerjaan: "Robot beroperasi-mendekatai assy part jig-A1",
        lostTime: 0,
        manualManpower: 1.0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 24,
        itemPekerjaan: "Robot memproses welding assy part jig-A1",
        lostTime: 0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
    ],
  },
  {
    id: "prepare-chil-part-jig-a1",
    name: "PREPARE CHIL PART JIG-A1",
    items: [
      {
        no: 25,
        itemPekerjaan: "Operator pindah ke jig-A1",
        lostTime: 0,
        manualManpower: 1.0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 26,
        itemPekerjaan: "Buka clamping jig-A1",
        lostTime: 1.0,
        manualManpower: 0,
        autoPositioner: 5.0,
        prosesWeld: 0,
      },
      {
        no: 27,
        itemPekerjaan: "Ambil part finis proses di jig-A1",
        lostTime: 1.0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 28,
        itemPekerjaan: "Penyimpanan part finis proses ke box standar",
        lostTime: 0,
        manualManpower: 1.0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 29,
        itemPekerjaan: "Pengambilan Wip chil part dan tempatkan di jig-A1",
        lostTime: 1.0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 30,
        itemPekerjaan: "Tekan pust bottom clamping part",
        lostTime: 3.0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
    ],
  },
  {
    id: "jig-b2-finis",
    name: "PROGRAM NO-2 (JIG B2) FINIS",
    items: [
      {
        no: 31,
        itemPekerjaan: "Robot finis proses welding jig-B2 menjauh dari produck",
        lostTime: 0,
        manualManpower: 1.0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 32,
        itemPekerjaan: "Positioner / rotari berputar mengeluarkan jig-B2 & memposisikan jig-A1",
        lostTime: 0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
    ],
  },
  {
    id: "jig-b1-star",
    name: "PROGRAM NO-2 (JIG B1) STAR",
    items: [
      {
        no: 33,
        itemPekerjaan: "Robot beroperasi-mendekatai assy part jig-B1",
        lostTime: 0,
        manualManpower: 1.0,
        autoPositioner: 4.0,
        prosesWeld: 0,
      },
      {
        no: 34,
        itemPekerjaan: "Robot memproses welding assy part jig-B1",
        lostTime: 0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
    ],
  },
  {
    id: "prepare-jig-a2",
    name: "PREPARE JIG-A2",
    items: [
      {
        no: 35,
        itemPekerjaan: "Operator pindah ke jig-A2",
        lostTime: 0,
        manualManpower: 1.0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 36,
        itemPekerjaan: "Buka clamping jig-A2",
        lostTime: 1.0,
        manualManpower: 0,
        autoPositioner: 5.0,
        prosesWeld: 0,
      },
      {
        no: 37,
        itemPekerjaan: "Ambil part finis proses di jig-A2",
        lostTime: 1.0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 38,
        itemPekerjaan: "Penyimpanan part finis proses ke box standar",
        lostTime: 0,
        manualManpower: 1.0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 39,
        itemPekerjaan: "Pengambil part finis proses di jig-A2",
        lostTime: 1.0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 40,
        itemPekerjaan: "Tekan pust bottom clamping part",
        lostTime: 3.0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
    ],
  },
  {
    id: "robot-waiting",
    name: "TOTAL ROBOT MENUNGGU UNTUK PROSES DENGAN QTY 4 SET",
    items: [
      {
        no: 41,
        itemPekerjaan: "TOTAL ROBOT MENUNGGU UNTUK PROSES DENGAN QTY 4 SET",
        lostTime: 0,
        manualManpower: 1.0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
    ],
  },
  {
    id: "jig-a1-star-2",
    name: "PROGRAM NO 1- (JIG A1) STAR",
    items: [
      {
        no: 42,
        itemPekerjaan: "Tekan pust bottom star",
        lostTime: 7.0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 43,
        itemPekerjaan: "Robot beroperasi-mendekatai assy part jig-A1",
        lostTime: 0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
      {
        no: 44,
        itemPekerjaan: "Robot memproses welding assy part jig-A1",
        lostTime: 0,
        manualManpower: 0,
        autoPositioner: 0,
        prosesWeld: 0,
      },
    ],
  },
]

export default function ManageProgres() {
  const [selectedTSKs, setSelectedTSKs] = useState<string[]>([])
  const [currentTSK, setCurrentTSK] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [allPrograms, setAllPrograms] = useState<TSKProgram[]>([])
  const [editableItems, setEditableItems] = useState<{ [key: string]: WorkItem }>({})
  const [chartData, setChartData] = useState<any[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Get real user data from authentication context
  const { user, handleLogout: authLogout } = useAuth()

  // Filter TSK programs based on search term
  const filteredTSKPrograms = tskPrograms.filter(
    (program) =>
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  useEffect(() => {
    if (selectedTSKs.length > 0) {
      const programs = selectedTSKs
        .map((tskId) => tskPrograms.find((p) => p.id === tskId))
        .filter(Boolean) as TSKProgram[]
      setAllPrograms(programs)
    } else {
      setAllPrograms([])
    }
  }, [selectedTSKs])

  const handleLogout = () => {
    // Directly call the real logout function from AuthContext without confirmation
    authLogout()
  }

  const addTSK = () => {
    if (currentTSK) {
      setSelectedTSKs((prev) => [...prev, currentTSK])
      setCurrentTSK("")
      setSearchTerm("")
    }
  }

  const removeTSK = (index: number) => {
    setSelectedTSKs((prev) => prev.filter((_, i) => i !== index))
  }

  const moveTSKUp = (index: number) => {
    if (index > 0) {
      const newTSKs = [...selectedTSKs]
      ;[newTSKs[index - 1], newTSKs[index]] = [newTSKs[index], newTSKs[index - 1]]
      setSelectedTSKs(newTSKs)
    }
  }

  const moveTSKDown = (index: number) => {
    if (index < selectedTSKs.length - 1) {
      const newTSKs = [...selectedTSKs]
      ;[newTSKs[index], newTSKs[index + 1]] = [newTSKs[index + 1], newTSKs[index]]
      setSelectedTSKs(newTSKs)
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/html", index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newTSKs = [...selectedTSKs]
    const draggedItem = newTSKs[draggedIndex]

    // Remove the dragged item
    newTSKs.splice(draggedIndex, 1)

    // Insert at new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex
    newTSKs.splice(insertIndex, 0, draggedItem)

    setSelectedTSKs(newTSKs)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const updateItemTime = (
    programId: string,
    programIndex: number,
    itemNo: number,
    field: keyof Pick<WorkItem, "lostTime" | "manualManpower" | "autoPositioner" | "prosesWeld">,
    value: number,
  ) => {
    const key = `${programId}-${programIndex}-${itemNo}`
    setEditableItems((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }))
  }

  const getItemValue = (
    programId: string,
    programIndex: number,
    itemNo: number,
    field: keyof Pick<WorkItem, "lostTime" | "manualManpower" | "autoPositioner" | "prosesWeld">,
  ) => {
    const key = `${programId}-${programIndex}-${itemNo}`

    // If user has manually edited this value, return the edited value
    if (editableItems[key]?.[field] !== undefined) {
      return editableItems[key][field]
    }

    // Otherwise, return the default value from the original data
    const program = tskPrograms.find((p) => p.id === programId)
    const item = program?.items.find((i) => i.no === itemNo)
    return item?.[field] ?? 0
  }

  const generateChart = () => {
    if (allPrograms.length === 0) return

    let cumulativeTime = 0
    let stepCounter = 1 // Add sequential step counter
    const data: any[] = []

    allPrograms.forEach((program, programIndex) => {
      program.items.forEach((item, itemIndex) => {
        const lostTime = getItemValue(program.id, programIndex, item.no, "lostTime")
        const manualManpower = getItemValue(program.id, programIndex, item.no, "manualManpower")
        const autoPositioner = getItemValue(program.id, programIndex, item.no, "autoPositioner")
        const prosesWeld = getItemValue(program.id, programIndex, item.no, "prosesWeld")
        const totalItemTime = lostTime + manualManpower + autoPositioner + prosesWeld

        const startTime = cumulativeTime
        cumulativeTime += totalItemTime

        data.push({
          name: `Step ${stepCounter}`, // Use sequential step counter instead of item.no
          originalNo: item.no, // Keep original number for reference
          programName: program.name,
          startTime,
          endTime: cumulativeTime,
          duration: totalItemTime,
          lostTime,
          manualManpower,
          autoPositioner,
          prosesWeld,
          itemPekerjaan: item.itemPekerjaan,
          programIndex,
          itemIndex,
        })

        stepCounter++ // Increment step counter
      })
    })

    setChartData(data)
  }

  const getTotalTime = () => {
    if (allPrograms.length === 0) return { lostTime: 0, manualManpower: 0, autoPositioner: 0, prosesWeld: 0, total: 0 }

    return allPrograms.reduce(
      (programAcc, program, programIndex) => {
        const programTotals = program.items.reduce(
          (acc, item) => {
            const lostTime = getItemValue(program.id, programIndex, item.no, "lostTime")
            const manualManpower = getItemValue(program.id, programIndex, item.no, "manualManpower")
            const autoPositioner = getItemValue(program.id, programIndex, item.no, "autoPositioner")
            const prosesWeld = getItemValue(program.id, programIndex, item.no, "prosesWeld")

            return {
              lostTime: acc.lostTime + lostTime,
              manualManpower: acc.manualManpower + manualManpower,
              autoPositioner: acc.autoPositioner + autoPositioner,
              prosesWeld: acc.prosesWeld + prosesWeld,
              total: acc.total + lostTime + manualManpower + autoPositioner + prosesWeld,
            }
          },
          { lostTime: 0, manualManpower: 0, autoPositioner: 0, prosesWeld: 0, total: 0 },
        )

        return {
          lostTime: programAcc.lostTime + programTotals.lostTime,
          manualManpower: programAcc.manualManpower + programTotals.manualManpower,
          autoPositioner: programAcc.autoPositioner + programTotals.autoPositioner,
          prosesWeld: programAcc.prosesWeld + programTotals.prosesWeld,
          total: programAcc.total + programTotals.total,
        }
      },
      { lostTime: 0, manualManpower: 0, autoPositioner: 0, prosesWeld: 0, total: 0 },
    )
  }

  const totals = getTotalTime()

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* User Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Company Logo/Name */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg">
                <Factory className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">STANDAR KERJA KOMBINASI</h1>
                <p className="text-xs text-slate-400">Standardized Work Combination System</p>
              </div>
            </div>

            {/* Right side - User Info & Logout */}
            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="flex items-center gap-3 bg-slate-700/50 rounded-lg px-4 py-2 border border-slate-600">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <User className="h-4 w-4 text-blue-400" />
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-200">{user?.nama || "User"}</div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <IdCard className="h-3 w-3" />
                    NIP: {user?.nip || "-"}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 rounded-lg text-red-400 hover:text-red-300 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced TSK Configuration with Dark Theme */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-slate-700">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg p-6">
            <h2 className="flex items-center gap-3 text-xl font-semibold">
              <Settings className="h-6 w-6" />
              TSK Configuration Center
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Enhanced Search Section */}
            <div className="space-y-4">
              <label className="text-lg font-semibold flex items-center gap-2 text-slate-200">
                <Search className="h-5 w-5 text-blue-400" />
                Cari dan Tambah TSK Program
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Ketik untuk mencari TSK Program (contoh: JIG A1, PREPARE, PROGRAM NO-1...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 h-12 text-lg bg-slate-700 border-2 border-slate-600 focus:border-blue-500 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-400"
                />
              </div>

              {/* Enhanced Search Results */}
              {searchTerm && (
                <div className="max-h-80 overflow-y-auto border-2 border-slate-600 rounded-xl bg-slate-800 shadow-lg">
                  {filteredTSKPrograms.length > 0 ? (
                    filteredTSKPrograms.map((program) => (
                      <div
                        key={program.id}
                        className="p-4 hover:bg-slate-700/50 cursor-pointer border-b border-slate-700 last:border-b-0 flex justify-between items-center transition-all duration-200"
                        onClick={() => {
                          setSelectedTSKs((prev) => [...prev, program.id])
                          setSearchTerm("")
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                            <Settings className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200">{program.name}</div>
                            <div className="text-sm text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {program.items.length} item pekerjaan
                            </div>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1">
                          <Plus className="h-4 w-4" />
                          Tambah
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400">
                      <Search className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                      <p>Tidak ada TSK Program yang ditemukan</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Alternative Dropdown */}
            <div className="space-y-3">
              <label className="text-base font-medium text-slate-300">Atau pilih dari dropdown</label>
              <div className="flex gap-3">
                <select
                  value={currentTSK}
                  onChange={(e) => setCurrentTSK(e.target.value)}
                  className="flex-1 h-12 bg-slate-700 border-2 border-slate-600 focus:border-blue-500 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-white"
                >
                  <option value="">Pilih TSK Program untuk ditambahkan</option>
                  {tskPrograms.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addTSK}
                  disabled={!currentTSK}
                  className="h-12 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Tambah TSK
                </button>
              </div>
            </div>

            {/* Enhanced Selected TSKs */}
            {selectedTSKs.length > 0 && (
              <div className="space-y-4">
                <label className="text-lg font-semibold flex items-center gap-2 text-slate-200">
                  <ChevronRight className="h-5 w-5 text-emerald-400" />
                  Urutan TSK yang Dipilih ({selectedTSKs.length} program) - Drag & Drop untuk mengatur ulang
                </label>
                <div className="grid gap-3 max-h-80 overflow-y-auto">
                  {selectedTSKs.map((tskId, index) => {
                    const program = tskPrograms.find((p) => p.id === tskId)
                    const isDragging = draggedIndex === index
                    const isDragOver = dragOverIndex === index

                    return (
                      <div
                        key={`${tskId}-${index}`}
                        className={`flex items-center gap-3 p-4 rounded-xl border shadow-sm transition-all duration-200 cursor-move ${
                          isDragging
                            ? "bg-slate-600/70 border-blue-400 opacity-50 scale-105"
                            : isDragOver
                              ? "bg-slate-600/50 border-cyan-400 border-2"
                              : "bg-slate-700/50 border-slate-600 hover:bg-slate-700"
                        }`}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveTSKUp(index)}
                            disabled={index === 0}
                            className="h-8 w-8 p-0 border border-slate-600 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium transition-all duration-200 text-slate-300"
                          >
                            <ArrowUp className="h-3 w-3 mx-auto" />
                          </button>
                          <button
                            onClick={() => moveTSKDown(index)}
                            disabled={index === selectedTSKs.length - 1}
                            className="h-8 w-8 p-0 border border-slate-600 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium transition-all duration-200 text-slate-300"
                          >
                            <ArrowDown className="h-3 w-3 mx-auto" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                            <div className="text-sm font-bold text-blue-400">#{index + 1}</div>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-200">{program?.name}</div>
                            <div className="text-sm text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {program?.items.length} item pekerjaan
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded border border-slate-600">
                            Drag to reorder
                          </div>
                        </div>
                        <button
                          onClick={() => removeTSK(index)}
                          className="h-10 w-10 p-0 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200"
                        >
                          <X className="h-4 w-4 mx-auto" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <button
              onClick={generateChart}
              className="w-full h-14 text-lg bg-emerald-500 hover:bg-emerald-600 shadow-lg text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
              disabled={selectedTSKs.length === 0}
            >
              <BarChart3 className="h-5 w-5" />
              Generate Operation Time Chart
            </button>
          </div>
        </div>

        {/* Enhanced Work Items Table */}
        {allPrograms.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-slate-700">
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-t-lg p-6">
              <h2 className="flex items-center gap-3 text-xl font-semibold">
                <Users className="h-6 w-6" />
                Item Pekerjaan / Proses
              </h2>
              <p className="text-emerald-100 mt-2">
                {selectedTSKs.length} TSK Program(s) dipilih - Total{" "}
                {allPrograms.reduce((acc, prog) => acc + prog.items.length, 0)} item pekerjaan
              </p>
            </div>
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-700/50">
                      <th className="w-16 font-bold p-4 text-left text-slate-200">No.</th>
                      <th className="w-40 font-bold p-4 text-left text-slate-200">TSK Program</th>
                      <th className="min-w-[300px] font-bold p-4 text-left text-slate-200">Item Pekerjaan / Proses</th>
                      <th className="text-center font-bold p-4">
                        <div className="flex items-center justify-center gap-1 text-slate-200">
                          <Clock className="h-4 w-4 text-red-400" />
                          Lost Time
                        </div>
                      </th>
                      <th className="text-center font-bold p-4">
                        <div className="flex items-center justify-center gap-1 text-slate-200">
                          <Users className="h-4 w-4 text-emerald-400" />
                          Manual Manpower
                        </div>
                      </th>
                      <th className="text-center font-bold p-4">
                        <div className="flex items-center justify-center gap-1 text-slate-200">
                          <Settings className="h-4 w-4 text-amber-400" />
                          Auto Positioner & Robot
                        </div>
                      </th>
                      <th className="text-center font-bold p-4">
                        <div className="flex items-center justify-center gap-1 text-slate-200">
                          <Zap className="h-4 w-4 text-orange-400" />
                          Proses Weld
                        </div>
                      </th>
                      <th className="text-center font-bold p-4 text-slate-200">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let sequentialNo = 1 // Add sequential counter
                      return allPrograms.map((program, programIndex) =>
                        program.items.map((item, itemIndex) => {
                          const currentNo = sequentialNo++ // Use and increment sequential number
                          return (
                            <tr
                              key={`${program.id}-${programIndex}-${item.no}`}
                              className="hover:bg-slate-700/30 transition-colors border-b border-slate-700"
                            >
                              <td className="font-bold text-blue-400 p-4">{currentNo}</td>{" "}
                              {/* Use sequential number instead of item.no */}
                              <td className="p-4">
                                <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300">
                                  {program.name.split(" ").slice(0, 3).join(" ")}
                                </span>
                              </td>
                              <td className="font-medium p-4 text-slate-200">{item.itemPekerjaan}</td>
                              <td className="text-center p-4">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={getItemValue(program.id, programIndex, item.no, "lostTime")}
                                  onChange={(e) =>
                                    updateItemTime(
                                      program.id,
                                      programIndex,
                                      item.no,
                                      "lostTime",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-20 text-center bg-slate-700 border-2 border-red-500/30 focus:border-red-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-white"
                                  placeholder={item.lostTime.toString()}
                                />
                              </td>
                              <td className="text-center p-4">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={getItemValue(program.id, programIndex, item.no, "manualManpower")}
                                  onChange={(e) =>
                                    updateItemTime(
                                      program.id,
                                      programIndex,
                                      item.no,
                                      "manualManpower",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-20 text-center bg-slate-700 border-2 border-emerald-500/30 focus:border-emerald-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-white"
                                  placeholder={item.manualManpower.toString()}
                                />
                              </td>
                              <td className="text-center p-4">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={getItemValue(program.id, programIndex, item.no, "autoPositioner")}
                                  onChange={(e) =>
                                    updateItemTime(
                                      program.id,
                                      programIndex,
                                      item.no,
                                      "autoPositioner",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-20 text-center bg-slate-700 border-2 border-amber-500/30 focus:border-amber-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-white"
                                  placeholder={item.autoPositioner.toString()}
                                />
                              </td>
                              <td className="text-center p-4">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={getItemValue(program.id, programIndex, item.no, "prosesWeld")}
                                  onChange={(e) =>
                                    updateItemTime(
                                      program.id,
                                      programIndex,
                                      item.no,
                                      "prosesWeld",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-20 text-center bg-slate-700 border-2 border-orange-500/30 focus:border-orange-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-white"
                                  placeholder={item.prosesWeld.toString()}
                                />
                              </td>
                              <td className="text-center font-bold text-blue-400 p-4">
                                {(
                                  getItemValue(program.id, programIndex, item.no, "lostTime") +
                                  getItemValue(program.id, programIndex, item.no, "manualManpower") +
                                  getItemValue(program.id, programIndex, item.no, "autoPositioner") +
                                  getItemValue(program.id, programIndex, item.no, "prosesWeld")
                                ).toFixed(2)}
                              </td>
                            </tr>
                          )
                        }),
                      )
                    })()}
                    <tr className="bg-slate-700/50 font-bold text-lg border-t-2 border-slate-600">
                      <td colSpan={3} className="text-center p-4 text-slate-200">
                        TOTAL
                      </td>
                      <td className="text-center text-red-400 p-4">{totals.lostTime.toFixed(2)}</td>
                      <td className="text-center text-emerald-400 p-4">{totals.manualManpower.toFixed(2)}</td>
                      <td className="text-center text-amber-400 p-4">{totals.autoPositioner.toFixed(2)}</td>
                      <td className="text-center text-orange-400 p-4">{totals.prosesWeld.toFixed(2)}</td>
                      <td className="text-center text-blue-400 text-xl p-4">{totals.total.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Operation Time Chart */}
        {chartData.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-slate-700">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg p-6">
              <h2 className="flex items-center gap-3 text-xl font-semibold">
                <BarChart3 className="h-6 w-6" />
                Operation Time Chart (Second)
              </h2>
              <p className="text-purple-100 mt-2">Grafik waktu operasi per detik - Gantt Chart Timeline</p>
            </div>
            <div className="p-6">
              <div className="h-[600px] w-full overflow-x-auto">
                <div className="min-w-[800px] h-full relative">
                  {/* Enhanced Time scale header */}
                  <div className="flex border-b-2 border-slate-600 mb-6 pb-4">
                    <div className="w-60 font-bold text-lg text-slate-200">Operation</div>
                    <div className="flex-1 relative">
                      <div className="flex justify-between text-sm text-slate-300 mb-2 font-medium">
                        {Array.from({ length: Math.ceil(totals.total / 5) + 1 }, (_, i) => (
                          <span
                            key={i}
                            className="text-center bg-slate-700 px-2 py-1 rounded border border-slate-600"
                            style={{ width: "40px" }}
                          >
                            {i * 5}s
                          </span>
                        ))}
                      </div>
                      <div className="h-6 bg-slate-700 relative rounded border border-slate-600">
                        {Array.from({ length: Math.ceil(totals.total / 5) }, (_, i) => (
                          <div
                            key={i}
                            className="absolute top-0 w-px h-full bg-slate-500"
                            style={{ left: `${((i * 5) / totals.total) * 100}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Gantt bars */}
                  <div className="space-y-2">
                    {chartData.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center h-10 hover:bg-slate-700/30 rounded-lg p-1 transition-all duration-200"
                      >
                        <div
                          className="w-60 text-sm pr-3 truncate text-slate-300"
                          title={`${item.programName} - ${item.itemPekerjaan}`}
                        >
                          <span className="inline-flex items-center px-2 py-1 text-xs mr-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300">
                            {item.programName.split(" ").slice(0, 2).join(" ")}
                          </span>
                          <span className="font-medium">{item.name}:</span> {item.itemPekerjaan.substring(0, 20)}...
                        </div>
                        <div className="flex-1 relative h-8 bg-slate-700 border-2 border-slate-600 rounded-lg overflow-hidden shadow-inner">
                          {/* Enhanced Lost Time */}
                          {item.lostTime > 0 && (
                            <div
                              className="absolute top-0 h-full bg-red-500 flex items-center justify-center text-xs text-white font-bold shadow-sm"
                              style={{
                                left: `${(item.startTime / totals.total) * 100}%`,
                                width: `${(item.lostTime / totals.total) * 100}%`,
                                minWidth: item.lostTime > 0 ? "2px" : "0",
                              }}
                              title={`Lost Time: ${item.lostTime}s`}
                            >
                              {item.lostTime > 2 ? `${item.lostTime}s` : ""}
                            </div>
                          )}

                          {/* Enhanced Manual Manpower */}
                          {item.manualManpower > 0 && (
                            <div
                              className="absolute top-0 h-full bg-emerald-500 flex items-center justify-center text-xs text-white font-bold shadow-sm"
                              style={{
                                left: `${((item.startTime + item.lostTime) / totals.total) * 100}%`,
                                width: `${(item.manualManpower / totals.total) * 100}%`,
                                minWidth: item.manualManpower > 0 ? "2px" : "0",
                              }}
                              title={`Manual Manpower: ${item.manualManpower}s`}
                            >
                              {item.manualManpower > 2 ? `${item.manualManpower}s` : ""}
                            </div>
                          )}

                          {/* Enhanced Auto Positioner */}
                          {item.autoPositioner > 0 && (
                            <div
                              className="absolute top-0 h-full bg-amber-500 flex items-center justify-center text-xs text-white font-bold shadow-sm"
                              style={{
                                left: `${((item.startTime + item.lostTime + item.manualManpower) / totals.total) * 100}%`,
                                width: `${(item.autoPositioner / totals.total) * 100}%`,
                                minWidth: item.autoPositioner > 0 ? "2px" : "0",
                              }}
                              title={`Auto Positioner: ${item.autoPositioner}s`}
                            >
                              {item.autoPositioner > 2 ? `${item.autoPositioner}s` : ""}
                            </div>
                          )}

                          {/* Enhanced Proses Weld */}
                          {item.prosesWeld > 0 && (
                            <div
                              className="absolute top-0 h-full bg-orange-500 flex items-center justify-center text-xs text-white font-bold shadow-sm"
                              style={{
                                left: `${((item.startTime + item.lostTime + item.manualManpower + item.autoPositioner) / totals.total) * 100}%`,
                                width: `${(item.prosesWeld / totals.total) * 100}%`,
                                minWidth: item.prosesWeld > 0 ? "2px" : "0",
                              }}
                              title={`Proses Weld: ${item.prosesWeld}s`}
                            >
                              {item.prosesWeld > 2 ? `${item.prosesWeld}s` : ""}
                            </div>
                          )}

                          {/* Enhanced Time markers */}
                          <div
                            className="absolute top-0 w-0.5 h-full bg-slate-400"
                            style={{ left: `${(item.startTime / totals.total) * 100}%` }}
                          />
                          <div
                            className="absolute top-0 w-0.5 h-full bg-slate-400"
                            style={{ left: `${(item.endTime / totals.total) * 100}%` }}
                          />
                        </div>
                        <div className="w-20 text-sm text-center font-bold text-blue-400 bg-slate-700/50 border border-slate-600 rounded-lg py-1 ml-2">
                          {item.duration.toFixed(1)}s
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Enhanced Legend */}
                  <div className="mt-8 flex flex-wrap gap-6 justify-center p-4 bg-slate-700/30 rounded-xl border border-slate-600">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-red-500 rounded shadow-sm"></div>
                      <span className="text-sm font-medium text-slate-300">Lost Time</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-emerald-500 rounded shadow-sm"></div>
                      <span className="text-sm font-medium text-slate-300">Manual Manpower</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-amber-500 rounded shadow-sm"></div>
                      <span className="text-sm font-medium text-slate-300">Auto Positioner & Robot</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-orange-500 rounded shadow-sm"></div>
                      <span className="text-sm font-medium text-slate-300">Proses Weld</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Summary Statistics */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="text-center p-6 bg-slate-800/50 border border-red-500/30 rounded-xl shadow-lg">
                  <Clock className="h-8 w-8 mx-auto mb-3 text-red-400" />
                  <div className="text-3xl font-bold text-red-400">{totals.lostTime.toFixed(2)}</div>
                  <div className="text-sm font-medium text-red-300 mt-1">Lost Time</div>
                </div>
                <div className="text-center p-6 bg-slate-800/50 border border-emerald-500/30 rounded-xl shadow-lg">
                  <Users className="h-8 w-8 mx-auto mb-3 text-emerald-400" />
                  <div className="text-3xl font-bold text-emerald-400">{totals.manualManpower.toFixed(2)}</div>
                  <div className="text-sm font-medium text-emerald-300 mt-1">Manual Manpower</div>
                </div>
                <div className="text-center p-6 bg-slate-800/50 border border-amber-500/30 rounded-xl shadow-lg">
                  <Settings className="h-8 w-8 mx-auto mb-3 text-amber-400" />
                  <div className="text-3xl font-bold text-amber-400">{totals.autoPositioner.toFixed(2)}</div>
                  <div className="text-sm font-medium text-amber-300 mt-1">Auto Positioner</div>
                </div>
                <div className="text-center p-6 bg-slate-800/50 border border-orange-500/30 rounded-xl shadow-lg">
                  <Zap className="h-8 w-8 mx-auto mb-3 text-orange-400" />
                  <div className="text-3xl font-bold text-orange-400">{totals.prosesWeld.toFixed(2)}</div>
                  <div className="text-sm font-medium text-orange-300 mt-1">Proses Weld</div>
                </div>
                <div className="text-center p-6 bg-slate-800/50 border border-blue-500/30 rounded-xl shadow-lg">
                  <BarChart3 className="h-8 w-8 mx-auto mb-3 text-blue-400" />
                  <div className="text-3xl font-bold text-blue-400">{totals.total.toFixed(2)}</div>
                  <div className="text-sm font-medium text-blue-300 mt-1">Total Time</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
