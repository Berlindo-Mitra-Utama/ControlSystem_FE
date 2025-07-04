"use client";

import type React from "react";
import { useState, useEffect } from "react";

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
];

interface DataItem {
  part: string;
  customer: string;
  timePerPcs: number;
  cycle1: number;
  cycle7: number;
  cycle35: number;
}

interface ScheduleItem {
  id: string;
  day: number;
  shift: string;
  type: string;
  pcs: number;
  time: string;
  processes: string;
  status: "Normal" | "Gangguan" | "Completed";
  actualPcs?: number;
  notes?: string;
}

interface SavedSchedule {
  id: string;
  name: string;
  date: string;
  form: any;
  schedule: ScheduleItem[];
}

interface User {
  username: string;
  email: string;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [currentView, setCurrentView] = useState<"scheduler" | "saved">(
    "scheduler",
  );

  const [form, setForm] = useState({
    part: "",
    customer: "",
    timePerPcs: 257,
    cycle1: 14,
    cycle7: 98,
    cycle35: 49,
    stock: 332,
    delivery: 5100,
    planningHour: 274,
    overtimeHour: 119,
    planningPcs: 3838,
    overtimePcs: 1672,
    isManualPlanningPcs: false,
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ScheduleItem>>({});

  useEffect(() => {
    // Load saved schedules from localStorage
    const saved = localStorage.getItem("savedSchedules");
    if (saved) {
      setSavedSchedules(JSON.parse(saved));
    }

    // Check if user is logged in
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    updateCalculatedFields();
  }, [form.timePerPcs, form.planningHour, form.overtimeHour]);

  useEffect(() => {
    if (
      form.isManualPlanningPcs &&
      form.timePerPcs > 0 &&
      form.planningPcs > 0
    ) {
      const calculatedPlanningHour =
        (form.planningPcs * form.timePerPcs) / 3600;

      setForm((prev) => ({
        ...prev,
        planningHour: Number.parseFloat(calculatedPlanningHour.toFixed(2)),
      }));
    }
  }, [form.planningPcs, form.isManualPlanningPcs]);

  const updateCalculatedFields = () => {
    const { timePerPcs, planningHour, overtimeHour, isManualPlanningPcs } =
      form;

    if (timePerPcs > 0) {
      const cycle1 = timePerPcs;
      const cycle7 = timePerPcs * 7;
      const cycle35 = timePerPcs * 3.5;

      const planningPcs = isManualPlanningPcs
        ? form.planningPcs
        : Math.floor((planningHour * 3600) / timePerPcs);
      const overtimePcs = Math.floor((overtimeHour * 3600) / timePerPcs);

      setForm((prev) => ({
        ...prev,
        cycle1,
        cycle7,
        cycle35,
        planningPcs,
        overtimePcs,
      }));
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username && loginForm.password) {
      const userData = {
        username: loginForm.username,
        email: `${loginForm.username}@berlindo.com`,
      };
      setUser(userData);
      setIsLoggedIn(true);
      localStorage.setItem("currentUser", JSON.stringify(userData));
      setLoginForm({ username: "", password: "" });
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem("currentUser");
    setCurrentView("scheduler");
  };

  const handleSelectPart = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = mockData.find((item) => item.part === e.target.value);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        part: selected.part,
        customer: selected.customer,
        timePerPcs: selected.timePerPcs,
        cycle1: selected.cycle1,
        cycle7: selected.cycle7,
        cycle35: selected.cycle35,
      }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "planningPcs") {
      setForm((prev) => ({
        ...prev,
        [name]: Number.parseFloat(value) || 0,
        isManualPlanningPcs: true,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: ["part", "customer", "processes"].includes(name)
          ? value
          : Number.parseFloat(value) || 0,
      }));
    }
  };

  const generateSchedule = async () => {
    setIsGenerating(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const { delivery, stock, timePerPcs, planningHour } = form;

    const totalNeed = delivery - stock;
    if (totalNeed <= 0) {
      alert("✅ Stock sudah cukup, tidak perlu produksi.");
      setIsGenerating(false);
      return;
    }

    // Shift 1: 8 AM - 12 PM (4 jam = 14400 detik)
    // Shift 2: 1 PM - 5 PM (4 jam = 14400 detik)
    const shift1Seconds = 14400; // 4 jam
    const shift2Seconds = 14400; // 4 jam
    const secondsPerDay = shift1Seconds + shift2Seconds;
    
    const maxPcsPerDay = Math.floor(secondsPerDay / timePerPcs);
    const daysNeeded = Math.ceil(totalNeed / maxPcsPerDay);
    
    const scheduleList: ScheduleItem[] = [];

    let remaining = totalNeed;
    let currentDay = 1;

    // Jadwalkan produksi untuk 30 hari (maksimal)
    while (remaining > 0 && currentDay <= 30) {
      // Shift 1: 8 AM - 12 PM
      const shift1Pcs = Math.min(Math.floor(shift1Seconds / timePerPcs), remaining);
      const shift1Used = shift1Pcs * timePerPcs;

      if (shift1Pcs > 0) {
        scheduleList.push({
          id: `${currentDay}-1`,
          day: currentDay,
          shift: "1",
          type: "Normal",
          pcs: shift1Pcs,
          time: (shift1Used / 60).toFixed(2),
          processes: "", // Kosongkan processes
          status: "Normal",
          actualPcs: shift1Pcs,
          notes: "",
        });
        remaining -= shift1Pcs;
      }

      // Shift 2: 1 PM - 5 PM
      if (remaining > 0) {
        const shift2Pcs = Math.min(Math.floor(shift2Seconds / timePerPcs), remaining);
        const shift2Used = shift2Pcs * timePerPcs;

        if (shift2Pcs > 0) {
          scheduleList.push({
            id: `${currentDay}-2`,
            day: currentDay,
            shift: "2",
            type: "Normal",
            pcs: shift2Pcs,
            time: (shift2Used / 60).toFixed(2),
            processes: "", // Kosongkan processes
            status: "Normal",
            actualPcs: shift2Pcs,
            notes: "",
          });
          remaining -= shift2Pcs;
        }
      }

      currentDay++;
    }

    // Jika masih ada sisa produksi, tambahkan ke lembur di hari ke-31
    if (remaining > 0) {
      const overtimeSeconds = remaining * timePerPcs;
      const overtimeMinutes = overtimeSeconds / 60;
      
      scheduleList.push({
        id: `31-1`,
        day: 31,
        shift: "1",
        type: "Lembur",
        pcs: remaining,
        time: overtimeMinutes.toFixed(2),
        processes: "", // Kosongkan processes
        status: "Normal",
        actualPcs: remaining,
        notes: "Lembur untuk memenuhi target produksi",
      });
    }

    setSchedule(scheduleList);
    setIsGenerating(false);
  };

  const recalculateSchedule = (updatedSchedule: ScheduleItem[]) => {
    const { timePerPcs } = form;

    // Calculate total disrupted production
    let totalDisrupted = 0;
    const processedSchedule = updatedSchedule.map((item) => {
      if (item.status === "Gangguan") {
        const disrupted = item.pcs - (item.actualPcs || 0);
        totalDisrupted += disrupted;
        return item;
      }
      return item;
    });

    if (totalDisrupted <= 0) {
      setSchedule(updatedSchedule);
      return;
    }

    // Tambahkan produksi yang terganggu ke lembur di hari ke-31
    
    // Cek apakah sudah ada lembur di hari ke-31
    const existingOvertimeIndex = processedSchedule.findIndex(item => item.day === 31 && item.type === "Lembur");
    
    if (existingOvertimeIndex >= 0) {
      // Update lembur yang sudah ada
      const updatedProcessedSchedule = [...processedSchedule];
      const existingOvertime = updatedProcessedSchedule[existingOvertimeIndex];
      const newPcs = existingOvertime.pcs + totalDisrupted;
      const newTime = ((newPcs * timePerPcs) / 60).toFixed(2);
      
      updatedProcessedSchedule[existingOvertimeIndex] = {
        ...existingOvertime,
        pcs: newPcs,
        actualPcs: newPcs,
        time: newTime,
        notes: "Lembur untuk memenuhi target produksi dan kompensasi gangguan",
      };
      
      setSchedule(updatedProcessedSchedule);
    } else {
      // Buat jadwal lembur baru di hari ke-31
      const overtimeSeconds = totalDisrupted * timePerPcs;
      const overtimeMinutes = overtimeSeconds / 60;
      
      const overtimeSchedule: ScheduleItem = {
        id: `31-1`,
        day: 31,
        shift: "1",
        type: "Lembur",
        pcs: totalDisrupted,
        time: overtimeMinutes.toFixed(2),
        processes: "", // Kosongkan processes
        status: "Normal",
        actualPcs: totalDisrupted,
        notes: "Kompensasi gangguan produksi",
      };
      
      setSchedule([...processedSchedule, overtimeSchedule]);
    }
  };

  const startEdit = (item: ScheduleItem) => {
    setEditingRow(item.id);
    setEditForm({
      status: item.status,
      actualPcs: item.actualPcs,
      notes: item.notes,
    });
  };

  const cancelEdit = () => {
    setEditingRow(null);
    setEditForm({});
  };

  const saveEdit = (itemId: string) => {
    const updatedSchedule = schedule.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          status: editForm.status || item.status,
          actualPcs:
            editForm.actualPcs !== undefined
              ? editForm.actualPcs
              : item.actualPcs,
          notes: editForm.notes || item.notes || "",
        };
      }
      return item;
    });

    recalculateSchedule(updatedSchedule);
    setEditingRow(null);
    setEditForm({});
  };

  const saveSchedule = () => {
    if (!scheduleName.trim()) {
      alert("Please enter a schedule name");
      return;
    }

    const newSchedule: SavedSchedule = {
      id: Date.now().toString(),
      name: scheduleName,
      date: new Date().toLocaleDateString(),
      form: { ...form },
      schedule: [...schedule],
    };

    const updatedSchedules = [...savedSchedules, newSchedule];
    setSavedSchedules(updatedSchedules);
    localStorage.setItem("savedSchedules", JSON.stringify(updatedSchedules));
    setScheduleName("");
    alert("Schedule saved successfully!");
  };

  const deleteSchedule = (id: string) => {
    const updatedSchedules = savedSchedules.filter((s) => s.id !== id);
    setSavedSchedules(updatedSchedules);
    localStorage.setItem("savedSchedules", JSON.stringify(updatedSchedules));
  };

  const loadSchedule = (savedSchedule: SavedSchedule) => {
    setForm(savedSchedule.form);
    setSchedule(savedSchedule.schedule);
    setCurrentView("scheduler");
  };

  const totalProduction = schedule.reduce(
    (sum, item) => sum + (item.actualPcs || item.pcs),
    0,
  );
  const totalPlanned = schedule.reduce((sum, item) => sum + item.pcs, 0);
  const totalDays =
    schedule.length > 0 ? Math.max(...schedule.map((item) => item.day)) : 0;
  const disruptedItems = schedule.filter(
    (item) => item.status === "Gangguan",
  ).length;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Production Scheduler
            </h1>
            <p className="text-gray-400">
              Sign in to access your production planning tools
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white placeholder-gray-500"
                placeholder="Enter your username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white placeholder-gray-500"
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all duration-300"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navigation */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">
              Production Scheduler
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setCurrentView("scheduler")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentView === "scheduler"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                Scheduler
              </button>
              <button
                onClick={() => setCurrentView("saved")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentView === "saved"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                Saved ({savedSchedules.length})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-all duration-200 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {currentView === "saved" ? (
            /* Saved Schedules View */
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white">Saved Schedules</h2>
              {savedSchedules.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No Saved Schedules
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Create and save your first production schedule to see it
                    here.
                  </p>
                  <button
                    onClick={() => setCurrentView("scheduler")}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                  >
                    Create Schedule
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedSchedules.map((savedSchedule) => (
                    <div
                      key={savedSchedule.id}
                      className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {savedSchedule.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            Created: {savedSchedule.date}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteSchedule(savedSchedule.id)}
                          className="text-gray-500 hover:text-red-400 transition-colors duration-200"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Part:</span>
                          <span className="text-white">
                            {savedSchedule.form.part || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Customer:</span>
                          <span className="text-white">
                            {savedSchedule.form.customer || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Items:</span>
                          <span className="text-white">
                            {savedSchedule.schedule.length} schedule items
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => loadSchedule(savedSchedule)}
                        className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                      >
                        Load Schedule
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Main Scheduler View */
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">
                        Total Production
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {totalProduction.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">PCS Actual</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">
                        Planned Production
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {totalPlanned.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">PCS Planned</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">
                        Production Days
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {totalDays}
                      </p>
                      <p className="text-xs text-gray-500">Days Required</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">
                        Disruptions
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {disruptedItems}
                      </p>
                      <p className="text-xs text-gray-500">Items Affected</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Form */}
              <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
                <div className="border-b border-gray-800 px-8 py-6">
                  <h2 className="text-2xl font-bold text-white">
                    Production Configuration
                  </h2>
                  <p className="text-gray-400 mt-1">
                    Configure your manufacturing parameters
                  </p>
                </div>

                <div className="p-8 space-y-8">
                  {/* Part Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">
                      Part Selection
                    </h3>
                    <select
                      onChange={handleSelectPart}
                      className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white appearance-none cursor-pointer hover:border-gray-600"
                    >
                      <option value="">Select a part to get started...</option>
                      {mockData.map((item, idx) => (
                        <option key={idx} value={item.part}>
                          {item.part} - {item.customer}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Basic Information */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { label: "Part Name", name: "part" },
                        { label: "Customer Name", name: "customer" },
                      ].map(({ label, name }) => (
                        <div key={name} className="space-y-3">
                          <label className="block text-sm font-medium text-gray-300">
                            {label}
                          </label>
                          <input
                            type="text"
                            name={name}
                            value={(form as any)[name]}
                            onChange={handleChange}
                            placeholder={`Enter ${label.toLowerCase()}`}
                            className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white placeholder-gray-500 hover:border-gray-600"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timing Parameters */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white">
                      Timing Parameters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        {
                          label: "Time per Piece",
                          name: "timePerPcs",
                          suffix: "sec",
                          editable: true,
                        },
                        {
                          label: "Cycle 1 Hour",
                          name: "cycle1",
                          suffix: "sec",
                          editable: false,
                        },
                        {
                          label: "Cycle 7 Hours",
                          name: "cycle7",
                          suffix: "sec",
                          editable: false,
                        },
                        {
                          label: "Cycle 3.5 Hours",
                          name: "cycle35",
                          suffix: "sec",
                          editable: false,
                        },
                      ].map(({ label, name, suffix, editable }) => (
                        <div key={name} className="space-y-3">
                          <label className="block text-sm font-medium text-gray-300">
                            {label}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              name={name}
                              value={(form as any)[name]}
                              onChange={handleChange}
                              className={`w-full px-4 py-4 pr-12 border rounded-xl transition-all duration-200 ${
                                editable
                                  ? "bg-gray-800 border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white hover:border-gray-600"
                                  : "bg-gray-800/50 border-gray-700 text-gray-400 cursor-not-allowed"
                              }`}
                              readOnly={!editable}
                            />
                            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                              {suffix}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Production Targets */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white">
                      Production Targets
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Input Section */}
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-300">
                              Current Stock
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                name="stock"
                                value={form.stock}
                                onChange={handleChange}
                                className="w-full px-4 py-4 pr-12 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white hover:border-gray-600"
                              />
                              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                                PCS
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-300">
                              Delivery Target
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                name="delivery"
                                value={form.delivery}
                                onChange={handleChange}
                                className="w-full px-4 py-4 pr-12 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white hover:border-gray-600"
                              />
                              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                                PCS
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-300">
                            Time per Piece
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              name="timePerPcs"
                              value={form.timePerPcs}
                              onChange={handleChange}
                              className="w-full px-4 py-4 pr-12 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white hover:border-gray-600"
                            />
                            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                              sec
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-300">
                            Planning Hours
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              name="planningHour"
                              value={form.planningHour}
                              onChange={handleChange}
                              className="w-full px-4 py-4 pr-12 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white hover:border-gray-600"
                            />
                            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                              hours
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Output Section - Informasi Shift */}
                      <div className="space-y-6">
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                          <h4 className="text-lg font-semibold text-white mb-4">
                            Informasi Shift
                          </h4>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">Shift 1:</span>
                              <span className="text-white font-medium">
                                08:00 - 12:00 (4 jam)
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">Shift 2:</span>
                              <span className="text-white font-medium">
                                13:00 - 17:00 (4 jam)
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">Lembur:</span>
                              <span className="text-white font-medium">
                                Hari ke-31 jika target belum terpenuhi
                              </span>
                            </div>
                            <div className="pt-2 border-t border-gray-700 mt-2">
                              <div className="text-sm text-gray-400">
                                Sistem akan menghitung produksi per shift
                                berdasarkan cycle time dan durasi shift. Jika
                                produksi belum memenuhi target setelah 30 hari,
                                sisa produksi akan ditambahkan ke lembur di hari
                                ke-31.
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                          <h4 className="text-lg font-semibold text-white mb-4">
                            Kalkulasi Produksi
                          </h4>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">
                                Target Produksi:
                              </span>
                              <span className="text-white font-medium">
                                {Math.max(0, form.delivery - form.stock)} PCS
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">
                                Produksi per Shift:
                              </span>
                              <span className="text-white font-medium">
                                {form.timePerPcs > 0
                                  ? Math.floor(14400 / form.timePerPcs)
                                  : 0}{" "}
                                PCS
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">
                                Produksi per Hari:
                              </span>
                              <span className="text-white font-medium">
                                {form.timePerPcs > 0
                                  ? Math.floor(28800 / form.timePerPcs)
                                  : 0}{" "}
                                PCS
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="flex justify-center pt-8">
                    <button
                      onClick={generateSchedule}
                      disabled={isGenerating}
                      className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3 shadow-lg"
                    >
                      {isGenerating ? (
                        <>
                          <svg
                            className="w-5 h-5 animate-spin"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Generating Schedule...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Generate Production Schedule
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Schedule Results */}
              {schedule.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
                  <div className="border-b border-gray-800 px-8 py-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          Production Schedule
                        </h2>
                        <p className="text-gray-400 mt-1">
                          Your optimized manufacturing timeline - Click to edit
                          status
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <input
                          type="text"
                          value={scheduleName}
                          onChange={(e) => setScheduleName(e.target.value)}
                          placeholder="Enter schedule name"
                          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={saveSchedule}
                          className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                            />
                          </svg>
                          Save
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <th className="text-left py-4 px-4 font-semibold text-gray-300 text-sm">
                              No
                            </th>
                            <th className="text-left py-4 px-4 font-semibold text-gray-300 text-sm">
                              Date
                            </th>
                            <th className="text-left py-4 px-4 font-semibold text-gray-300 text-sm">
                              Shift
                            </th>
                            <th className="text-left py-4 px-4 font-semibold text-gray-300 text-sm">
                              Type
                            </th>
                            <th className="text-left py-4 px-4 font-semibold text-gray-300 text-sm">
                              Status
                            </th>
                            <th className="text-right py-4 px-4 font-semibold text-gray-300 text-sm">
                              Target (PCS)
                            </th>
                            <th className="text-right py-4 px-4 font-semibold text-gray-300 text-sm">
                              Actual (PCS)
                            </th>
                            <th className="text-right py-4 px-4 font-semibold text-gray-300 text-sm">
                              Time (Min)
                            </th>
                            <th className="text-left py-4 px-4 font-semibold text-gray-300 text-sm">
                              Notes
                            </th>
                            <th className="text-center py-4 px-4 font-semibold text-gray-300 text-sm">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {schedule.map((row, idx) => (
                            <tr
                              key={row.id}
                              className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors duration-200"
                            >
                              <td className="py-4 px-4 font-medium text-white">
                                {idx + 1}
                              </td>
                              <td className="py-4 px-4 text-gray-300">{`${row.day} Juli 2024`}</td>
                              <td className="py-4 px-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                                  Shift {row.shift}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
                                    row.type.includes("Lembur")
                                      ? "bg-gradient-to-r from-orange-500 to-red-600 text-white"
                                      : "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                  }`}
                                >
                                  {row.type}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                {editingRow === row.id ? (
                                  <select
                                    value={editForm.status || row.status}
                                    onChange={(e) =>
                                      setEditForm((prev) => ({
                                        ...prev,
                                        status: e.target.value as any,
                                      }))
                                    }
                                    className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="Normal">Normal</option>
                                    <option value="Gangguan">Gangguan</option>
                                    <option value="Completed">Completed</option>
                                  </select>
                                ) : (
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
                                      row.status === "Normal"
                                        ? "bg-green-100 text-green-800"
                                        : row.status === "Gangguan"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {row.status}
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-right font-semibold text-white">
                                {row.pcs.toLocaleString()}
                              </td>
                              <td className="py-4 px-4 text-right">
                                {editingRow === row.id ? (
                                  <input
                                    type="number"
                                    value={
                                      editForm.actualPcs !== undefined
                                        ? editForm.actualPcs
                                        : row.actualPcs
                                    }
                                    onChange={(e) =>
                                      setEditForm((prev) => ({
                                        ...prev,
                                        actualPcs:
                                          Number.parseInt(e.target.value) || 0,
                                      }))
                                    }
                                    className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                                  />
                                ) : (
                                  <span
                                    className={`font-semibold ${row.status === "Gangguan" && (row.actualPcs || 0) < row.pcs ? "text-red-400" : "text-white"}`}
                                  >
                                    {(
                                      row.actualPcs || row.pcs
                                    ).toLocaleString()}
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-right text-gray-300">
                                {row.time}
                              </td>
                              <td className="py-4 px-4 text-sm">
                                {editingRow === row.id ? (
                                  <input
                                    type="text"
                                    value={
                                      editForm.notes !== undefined
                                        ? editForm.notes
                                        : row.notes
                                    }
                                    onChange={(e) =>
                                      setEditForm((prev) => ({
                                        ...prev,
                                        notes: e.target.value,
                                      }))
                                    }
                                    placeholder="Add notes..."
                                    className="w-32 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                                  />
                                ) : (
                                  <span className="text-gray-400">
                                    {row.notes || "-"}
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-center">
                                {editingRow === row.id ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => saveEdit(row.id)}
                                      className="text-green-400 hover:text-green-300 transition-colors duration-200"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="text-red-400 hover:text-red-300 transition-colors duration-200"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => startEdit(row)}
                                    className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
