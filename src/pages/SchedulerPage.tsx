import { useState, useEffect } from "react";
import ProductionForm from "../components/layout/ProductionForm";
import ScheduleTable from "../components/layout/ScheduleTable";
import React from "react";

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

interface DataItem {
  part: string;
  customer: string;
  timePerPcs: number;
  cycle1: number;
  cycle7: number;
  cycle35: number;
}

interface SchedulerPageProps {
  savedSchedules: SavedSchedule[];
  setSavedSchedules: React.Dispatch<React.SetStateAction<SavedSchedule[]>>;
  setCurrentView: (view: "dashboard" | "scheduler" | "saved") => void;
  loadedSchedule?: SavedSchedule | null;
}

interface SavedSchedule {
  id: string;
  name: string;
  date: string;
  form: any;
  schedule: ScheduleItem[];
}

const mockData: DataItem[] = [
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


const SchedulerPage: React.FC<SchedulerPageProps> = ({
  savedSchedules,
  setSavedSchedules,
  setCurrentView,
  loadedSchedule, // <-- add this prop if not already
}) => {
  const [form, setForm] = useState({
    part: "",
    customer: "",
    timePerPcs: 257,
    cycle1: 0,
    cycle7: 0,
    cycle35: 0,
    stock: 332,
    delivery: 5100,
    planningHour: 274,
    overtimeHour: 119,
    planningPcs: 3838,
    overtimePcs: 1672,
    isManualPlanningPcs: false,
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [showProductionForm, setShowProductionForm] = useState(false);
  // Show "Add New Production Planning" button if a schedule is loaded
  const [showAddButton, setShowAddButton] = useState(false);

  useEffect(() => {
    if (loadedSchedule && loadedSchedule.schedule.length > 0) {
      setShowAddButton(true);
    } else {
      setShowAddButton(false);
    }
  }, [loadedSchedule]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ScheduleItem>>({});
  const [showSavedSchedules, setShowSavedSchedules] = useState(false);

  // Automatically load schedule if loadedSchedule prop changes
  useEffect(() => {
    if (loadedSchedule) {
      setForm(loadedSchedule.form);
      setSchedule(loadedSchedule.schedule);
      setScheduleName(loadedSchedule.name);
    }
  }, [loadedSchedule]);

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
        isManualPlanningPcs: false,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        part: e.target.value,
        customer: "",
        timePerPcs: prev.timePerPcs > 0 ? prev.timePerPcs : 0,
        cycle1: 0,
        cycle7: 0,
        cycle35: 0,
        isManualPlanningPcs: true,
      }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const numericValue = Number.parseFloat(value);

    if (numericValue < 0) return;

    if (name === "planningPcs") {
      setForm((prev) => ({
        ...prev,
        [name]: numericValue || 0,
        isManualPlanningPcs: true,
      }));
    } else if (["cycle1", "cycle7", "cycle35"].includes(name)) {
      setForm((prev) => ({
        ...prev,
        [name]: numericValue || 0,
        isManualPlanningPcs: true,
      }));

      if (name === "cycle1" && numericValue > 0) {
        setForm((prev) => ({
          ...prev,
          timePerPcs: numericValue,
        }));
      }

      if (
        name === "timePerPcs" &&
        numericValue > 0 &&
        !form.isManualPlanningPcs
      ) {
        setForm((prev) => ({
          ...prev,
          cycle1: numericValue,
          cycle7: numericValue * 7,
          cycle35: numericValue * 3.5,
        }));
      }
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: ["part", "customer", "processes"].includes(name)
          ? value
          : numericValue || 0,
      }));
    }
  };

  const generateSchedule = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const { delivery, stock, timePerPcs } = form;
    const totalNeed = delivery - stock;

    if (totalNeed <= 0) {
      alert("✅ Stock sudah cukup, tidak perlu produksi.");
      setIsGenerating(false);
      return;
    }

    const shift1Seconds = 14400;
    const shift2Seconds = 14400;
    const scheduleList: ScheduleItem[] = [];
    let remaining = totalNeed;
    let currentDay = 1;

    while (remaining > 0 && currentDay <= 30) {
      const shift1Pcs = Math.min(
        Math.floor(shift1Seconds / timePerPcs),
        remaining,
      );
      const shift1Used = shift1Pcs * timePerPcs;

      if (shift1Pcs > 0) {
        scheduleList.push({
          id: `${currentDay}-1`,
          day: currentDay,
          shift: "1",
          type: "Normal",
          pcs: shift1Pcs,
          time: (shift1Used / 60).toFixed(2),
          processes: "",
          status: "Normal",
          actualPcs: shift1Pcs,
          notes: "",
        });
        remaining -= shift1Pcs;
      }

      if (remaining > 0) {
        const shift2Pcs = Math.min(
          Math.floor(shift2Seconds / timePerPcs),
          remaining,
        );
        const shift2Used = shift2Pcs * timePerPcs;

        if (shift2Pcs > 0) {
          scheduleList.push({
            id: `${currentDay}-2`,
            day: currentDay,
            shift: "2",
            type: "Normal",
            pcs: shift2Pcs,
            time: (shift2Used / 60).toFixed(2),
            processes: "",
            status: "Normal",
            actualPcs: shift2Pcs,
            notes: "",
          });
          remaining -= shift2Pcs;
        }
      }

      currentDay++;
    }

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
        processes: "",
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

    const existingOvertimeIndex = processedSchedule.findIndex(
      (item) => item.day === 31 && item.type === "Lembur",
    );

    if (existingOvertimeIndex >= 0) {
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
      const overtimeSeconds = totalDisrupted * timePerPcs;
      const overtimeMinutes = overtimeSeconds / 60;

      const overtimeSchedule: ScheduleItem = {
        id: `31-1`,
        day: 31,
        shift: "1",
        type: "Lembur",
        pcs: totalDisrupted,
        time: overtimeMinutes.toFixed(2),
        processes: "",
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

  // Load a saved schedule into the current state
  const loadSchedule = (savedSchedule: SavedSchedule) => {
    setForm(savedSchedule.form);
    setSchedule(savedSchedule.schedule);
    setScheduleName(savedSchedule.name);
    setShowSavedSchedules(false);
    setTimeout(() => {
      const tableSection = document.getElementById('schedule-table-section');
      if (tableSection) {
        tableSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  };

  // Delete a saved schedule
  const deleteSchedule = (id: string) => {
    const updatedSchedules = savedSchedules.filter((s) => s.id !== id);
    setSavedSchedules(updatedSchedules);
    localStorage.setItem("savedSchedules", JSON.stringify(updatedSchedules));
  };

  return (
    <>
      {/* Add New Production Planning Button (below navbar) */}
      {showAddButton && (
        <div className="flex justify-start mt-6 px-8">
          <button
            onClick={() => setShowProductionForm(true)}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Penjadwalan Baru
          </button>
        </div>
      )}
      {/* Saved Schedules Modal */}
      {showSavedSchedules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl mx-4 relative border border-gray-800 animate-fadeInUp overflow-y-auto" style={{ maxWidth: '600px', maxHeight: '90vh' }}>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-red-400 text-2xl font-bold z-10"
              onClick={() => setShowSavedSchedules(false)}
              aria-label="Tutup"
            >
              ×
            </button>
            <div className="p-8">
              <h2 className="text-xl font-bold text-white mb-4">Jadwal Tersimpan</h2>
              {savedSchedules.length === 0 ? (
                <div className="text-gray-400">Belum ada jadwal yang disimpan.</div>
              ) : (
                <ul className="space-y-4">
                  {savedSchedules.map((s) => (
                    <li key={s.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                      <div>
                        <div className="font-semibold text-white">{s.name}</div>
                        <div className="text-xs text-gray-400">{s.date}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                          onClick={() => {
                            loadSchedule(s);
                            setCurrentView && setCurrentView("scheduler");
                          }}
                        >
                          Tampilkan
                        </button>
                        <button
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                          onClick={() => deleteSchedule(s.id)}
                        >
                          Hapus
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Production Form Modal */}
      {showProductionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl mx-4 relative border border-gray-800 animate-fadeInUp overflow-y-auto" style={{ maxWidth: '800px', maxHeight: '90vh' }}>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-red-400 text-2xl font-bold z-10"
              onClick={() => setShowProductionForm(false)}
              aria-label="Tutup"
            >
              ×
            </button>
            <ProductionForm
              form={form}
              scheduleName={scheduleName}
              setScheduleName={setScheduleName}
              handleSelectPart={handleSelectPart}
              handleChange={handleChange}
              mockData={mockData}
              isGenerating={isGenerating}
              generateSchedule={() => {
                generateSchedule();
                setShowProductionForm(false);
              }}
              saveSchedule={saveSchedule}
            />
          </div>
        </div>
      )}

      {/* If no schedule, show blank state */}
      {schedule.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-900 border border-gray-800 rounded-3xl p-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Jadwal Produksi belum dibuat</h2>
            <p className="text-gray-400 mb-6">Lakukan penjadwalan sekarang</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowProductionForm(true)}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Tambah Penjadwalan
              </button>

            </div>
          </div>
        </div>
      ) : (
        <div id="schedule-table-section" className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
          <div className="border-b border-gray-800 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Production Schedule
                </h2>
                <p className="text-gray-400 mt-1">
                  Your optimized manufacturing timeline - Click to edit status
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
            <ScheduleTable
              schedule={schedule}
              editingRow={editingRow}
              editForm={editForm}
              startEdit={startEdit}
              saveEdit={saveEdit}
              cancelEdit={cancelEdit}
              setEditForm={setEditForm}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default SchedulerPage;
