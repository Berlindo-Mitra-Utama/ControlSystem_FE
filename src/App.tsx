"use client"

import type React from "react"

import { useState, useEffect } from "react"

// Mock data - replace with your actual data.json
const mockData = [
  {
    part: "Engine Block A1",
    customer: "Toyota Motors",
    timePerPcs: 257,
    cycle1: 14,
    cycle7: 98,
    cycle35: 49,
  },
  {
    part: "Transmission Case B2",
    customer: "Honda Corp",
    timePerPcs: 180,
    cycle1: 10,
    cycle7: 70,
    cycle35: 35,
  },
  {
    part: "Brake Disc C3",
    customer: "Nissan Ltd",
    timePerPcs: 120,
    cycle1: 8,
    cycle7: 56,
    cycle35: 28,
  },
]

interface DataItem {
  part: string
  customer: string
  timePerPcs: number
  cycle1: number
  cycle7: number
  cycle35: number
}

interface ScheduleItem {
  day: number
  shift: string
  type: string
  pcs: number
  time: string
  processes: string
}

function App() {
  const [form, setForm] = useState({
    machine: "",
    part: "",
    customer: "",
    timePerPcs: 257,
    cycle1: 14,
    cycle7: 98,
    cycle35: 49,
    processes: "Welding,Assembly,Packing",
    stock: 332,
    delivery: 5100,
    planningHour: 274,
    overtimeHour: 119,
    planningPcs: 3838,
    overtimePcs: 1672,
  })

  const [schedule, setSchedule] = useState<ScheduleItem[]>([])

  useEffect(() => {
    updateCalculatedFields()
  }, [form.timePerPcs, form.planningHour, form.overtimeHour])

  const updateCalculatedFields = () => {
    const { timePerPcs, planningHour, overtimeHour } = form

    if (timePerPcs > 0) {
      const cycle1 = timePerPcs
      const cycle7 = timePerPcs * 7
      const cycle35 = timePerPcs * 3.5
      const planningPcs = Math.floor((planningHour * 3600) / timePerPcs)
      const overtimePcs = Math.floor((overtimeHour * 3600) / timePerPcs)

      setForm((prev) => ({
        ...prev,
        cycle1,
        cycle7,
        cycle35,
        planningPcs,
        overtimePcs,
      }))
    }
  }

  const handleSelectPart = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = mockData.find((item) => item.part === e.target.value)
    if (selected) {
      setForm((prev) => ({
        ...prev,
        part: selected.part,
        customer: selected.customer,
        timePerPcs: selected.timePerPcs,
        cycle1: selected.cycle1,
        cycle7: selected.cycle7,
        cycle35: selected.cycle35,
      }))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: ["machine", "part", "customer", "processes"].includes(name) ? value : Number.parseFloat(value) || 0,
    }))
  }

  const generateSchedule = () => {
    const { delivery, stock, timePerPcs, planningHour, overtimeHour, processes } = form

    const totalNeed = delivery - stock
    if (totalNeed <= 0) {
      alert("✅ Stock sudah cukup, tidak perlu produksi.")
      return
    }

    const totalPlanningSeconds = planningHour * 3600
    const totalOvertimeSeconds = overtimeHour * 3600
    const totalAvailableSeconds = totalPlanningSeconds + totalOvertimeSeconds
    const maxTotalPcs = Math.floor(totalAvailableSeconds / timePerPcs)

    if (maxTotalPcs < totalNeed) {
      alert(`⚠️ Waktu tersedia hanya cukup untuk ${maxTotalPcs} PCS, sedangkan kebutuhan produksi: ${totalNeed} PCS`)
    }

    const processList = processes.split(",").map((p) => p.trim())
    const scheduleList: ScheduleItem[] = []

    let remaining = totalNeed
    let availableSeconds = totalAvailableSeconds
    let currentDay = 1

    while (remaining > 0 && availableSeconds > 0) {
      const shift1Seconds = Math.min(25200, availableSeconds)
      const shift1Pcs = Math.min(Math.floor(shift1Seconds / timePerPcs), remaining)
      const shift1Used = shift1Pcs * timePerPcs

      if (shift1Pcs > 0) {
        scheduleList.push({
          day: currentDay,
          shift: "1",
          type: "Normal",
          pcs: shift1Pcs,
          time: (shift1Used / 60).toFixed(2),
          processes: processList.join(", "),
        })
        remaining -= shift1Pcs
        availableSeconds -= shift1Used
      }

      const shift2Seconds = Math.min(37800, availableSeconds)
      const shift2Pcs = Math.min(Math.floor(shift2Seconds / timePerPcs), remaining)
      const shift2Used = shift2Pcs * timePerPcs

      if (shift2Pcs > 0) {
        const isLembur = shift2Seconds > 25200
        scheduleList.push({
          day: currentDay,
          shift: "2",
          type: isLembur ? "Normal + Lembur" : "Normal",
          pcs: shift2Pcs,
          time: (shift2Used / 60).toFixed(2),
          processes: processList.join(", "),
        })
        remaining -= shift2Pcs
        availableSeconds -= shift2Used
      }

      currentDay++
    }

    if (remaining > 0) {
      alert(`⚠️ Sisa PCS yang belum terjadwal: ${remaining}`)
    }

    setSchedule(scheduleList)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Production Scheduler</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Streamline your manufacturing process with intelligent production planning and scheduling
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Production Parameters</h2>
            </div>
          </div>

          <div className="p-8 space-y-10">
            {/* Part Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Part</label>
              <select
                onChange={handleSelectPart}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
              >
                <option value="">Choose a part...</option>
                {mockData.map((item, idx) => (
                  <option key={idx} value={item.part}>
                    {item.part} - {item.customer}
                  </option>
                ))}
              </select>
            </div>

            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Machine Name</label>
                  <input
                    type="text"
                    name="machine"
                    value={form.machine}
                    onChange={handleChange}
                    placeholder="Enter machine name"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Part Name</label>
                  <input
                    type="text"
                    name="part"
                    value={form.part}
                    onChange={handleChange}
                    placeholder="Enter part name"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                  <input
                    type="text"
                    name="customer"
                    value={form.customer}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Timing Parameters */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                Timing Parameters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Time per Piece (sec)</label>
                  <input
                    type="number"
                    name="timePerPcs"
                    value={form.timePerPcs}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Cycle 1 Hour (sec)</label>
                  <input
                    type="number"
                    name="cycle1"
                    value={form.cycle1}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Cycle 7 Hours (sec)</label>
                  <input
                    type="number"
                    name="cycle7"
                    value={form.cycle7}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Cycle 3.5 Hours (sec)</label>
                  <input
                    type="number"
                    name="cycle35"
                    value={form.cycle35}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Production Targets */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                Production Targets
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                        Stock (PCS)
                      </label>
                      <input
                        type="number"
                        name="stock"
                        value={form.stock}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Delivery (PCS)
                      </label>
                      <input
                        type="number"
                        name="delivery"
                        value={form.delivery}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Planning Hours</label>
                      <input
                        type="number"
                        name="planningHour"
                        value={form.planningHour}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Overtime Hours</label>
                      <input
                        type="number"
                        name="overtimeHour"
                        value={form.overtimeHour}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Planning Target (PCS)</label>
                      <input
                        type="number"
                        name="planningPcs"
                        value={form.planningPcs}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600"
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Overtime Target (PCS)</label>
                      <input
                        type="number"
                        name="overtimePcs"
                        value={form.overtimePcs}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Processes</label>
                    <textarea
                      name="processes"
                      value={form.processes}
                      onChange={handleChange}
                      placeholder="Enter processes separated by commas"
                      rows={4}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <button
                onClick={generateSchedule}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Generate Schedule
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Results */}
        {schedule.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-8 py-6 border-b border-gray-200/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Production Schedule</h2>
              </div>
            </div>

            <div className="p-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">No</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Date</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Shift</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Type</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700 text-sm">Target (PCS)</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700 text-sm">Time (Min)</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Processes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150"
                      >
                        <td className="py-4 px-4 font-medium text-gray-900">{idx + 1}</td>
                        <td className="py-4 px-4 text-gray-700">{`${row.day} Juli`}</td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Shift {row.shift}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              row.type.includes("Lembur") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                            }`}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-gray-900">{row.pcs.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right text-gray-700">{row.time}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{row.processes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
