import { useState, useEffect } from "react";
import ProductionForm from "../components/layout/ProductionForm";
import ScheduleTable from "../components/layout/ScheduleTable";
import React from "react";
import { useSchedule } from "../contexts/ScheduleContext";
import { useNavigate } from "react-router-dom";
import Modal from "../components/ui/Modal";
import CompactDatePicker from "../components/ui/CompactDatePicker";
import { useNotification } from "../../../hooks/useNotification";

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
  delivery?: number; // jumlah permintaan customer per hari
  // Kolom hasil perhitungan planning produksi:
  planningPcs?: number;
  overtimePcs?: number;
  sisaPlanningPcs?: number;
  sisaStock?: number;
  selisih?: number; // selisih planning pcs jika diedit, hanya untuk tampilan
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
    part: "29N MUFFLER",
    customer: "Sakura",
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

const SchedulerPage: React.FC = () => {
  const { savedSchedules, setSavedSchedules, loadedSchedule } = useSchedule();
  const navigate = useNavigate();
  const {
    notification,
    hideNotification,
    showAlert,
    showSuccess,
    showConfirm,
  } = useNotification();
  const [form, setForm] = useState({
    part: "",
    customer: "",
    timePerPcs: 257,
    cycle1: 0,
    cycle7: 0,
    cycle35: 0,
    stock: 0,
    planningHour: 274,
    overtimeHour: 119,
    planningPcs: 3838,
    overtimePcs: 1672,
    isManualPlanningPcs: false,
    manpowers: [],
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
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ScheduleItem>>({});
  const [showSavedSchedules, setShowSavedSchedules] = useState(false);

  // Date picker states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Generate schedule name from selected month/year
  const getScheduleName = () => {
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return `${months[selectedMonth]} ${selectedYear}`;
  };

  // Automatically load schedule if loadedSchedule prop changes
  useEffect(() => {
    if (loadedSchedule) {
      setForm(loadedSchedule.form);
      setSchedule(loadedSchedule.schedule);
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
    if (name === "manpowers") {
      // handled by custom handler, not here
      return;
    }
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

  // Handler for manpowers (add/remove)
  const addManPower = (name: string) => {
    setForm((prev) => ({
      ...prev,
      manpowers: [...(prev.manpowers || []), name],
    }));
  };
  const removeManPower = (name: string) => {
    setForm((prev) => ({
      ...prev,
      manpowers: (prev.manpowers || []).filter((mp) => mp !== name),
    }));
  };

  const generateSchedule = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Save previous delivery values if possible
    const prevSchedule = schedule;
    const prevDeliveryMap = new Map<string, number | undefined>();
    prevSchedule.forEach((item) => {
      prevDeliveryMap.set(item.id, item.delivery);
    });

    // Parameter produksi
    const waktuKerjaShift = 7; // jam kerja per shift
    let timePerPcs = form.timePerPcs;
    let manpowerCount = Array.isArray(form.manpowers)
      ? form.manpowers.filter((mp) => mp.trim() !== "").length
      : 1;
    if (manpowerCount < 1) manpowerCount = 1;
    // Koreksi: waktu produksi per shift = 7 jam, kapasitas produksi per shift = (7*3600) / (timePerPcs/manpowerCount)
    const kapasitasShift =
      timePerPcs > 0 && manpowerCount > 0
        ? Math.floor((waktuKerjaShift * 3600) / (timePerPcs / manpowerCount))
        : 0;
    let sisaStock = form.stock;
    let shortfall = 0;
    let overtimeRows: ScheduleItem[] = [];
    const scheduleList: ScheduleItem[] = [];

    // Simulasi 30 hari produksi
    for (let d = 1; d <= 30; d++) {
      // Delivery per hari (bisa diisi user, default 0, atau ambil dari prevDeliveryMap shift 1)
      const idShift1 = `${d}-1`;
      let deliveryShift1 = prevDeliveryMap.get(idShift1) ?? 0;
      // Shift 2 tidak ada delivery
      // Total delivery hari ini
      let totalDelivery = deliveryShift1;
      // Bagi delivery ke 2 shift
      let planningHariIni = Math.min(totalDelivery, sisaStock);
      let planningShift1 = Math.min(
        Math.floor(planningHariIni / 2),
        kapasitasShift,
        sisaStock,
      );
      sisaStock -= planningShift1;
      let planningShift2 = Math.min(
        planningHariIni - planningShift1,
        kapasitasShift,
        sisaStock,
      );
      sisaStock -= planningShift2;
      // Jika delivery > total produksi hari ini, shortfall
      let shortfallHariIni = totalDelivery - (planningShift1 + planningShift2);
      if (shortfallHariIni > 0) {
        shortfall += shortfallHariIni;
      }
      // Row shift 1
      scheduleList.push({
        id: idShift1,
        day: d,
        shift: "1",
        type: "Produksi",
        pcs: planningShift1,
        time: "07:00-15:00",
        processes: "",
        status: "Normal",
        delivery: deliveryShift1,
        planningPcs: planningShift1,
        overtimePcs: 0,
        notes: "",
      });
      // Row shift 2
      scheduleList.push({
        id: `${d}-2`,
        day: d,
        shift: "2",
        type: "Produksi",
        pcs: planningShift2,
        time: "15:00-23:00",
        processes: "",
        status: "Normal",
        delivery: undefined,
        planningPcs: planningShift2,
        overtimePcs: 0,
        notes: "",
      });
      // Setiap 3 hari, shortfall dijadwalkan sebagai lembur 2 hari kemudian
      if (d % 3 === 0 && shortfall > 0) {
        const lemburDay = d + 2;
        if (lemburDay <= 30) {
          overtimeRows.push({
            id: `${lemburDay}-OT`,
            day: lemburDay,
            shift: "-",
            type: "Lembur",
            pcs: shortfall,
            time: "-",
            processes: "",
            status: "Normal",
            delivery: undefined,
            planningPcs: 0,
            overtimePcs: shortfall,
            notes: `Lembur dari shortfall hari ${d - 2} s/d ${d}`,
          });
          sisaStock -= shortfall;
        }
        shortfall = 0;
      }
    }
    // Gabungkan lembur ke schedule utama, urutkan berdasarkan hari
    const allRows = [...scheduleList, ...overtimeRows];
    allRows.sort(
      (a, b) => a.day - b.day || (a.shift || "").localeCompare(b.shift || ""),
    );
    setSchedule(allRows);
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
    // Ambil semua delivery terbaru dari tabel (termasuk editForm jika sedang diedit)
    const deliveryMap: { [key: string]: number } = {};
    schedule.forEach((item) => {
      if (item.id === itemId && editForm.delivery !== undefined) {
        deliveryMap[item.id] = editForm.delivery;
      } else if (item.delivery !== undefined) {
        deliveryMap[item.id] = item.delivery;
      }
    });

    // --- Detect planningPcs change and propagate selisih ---
    let changedPlanningDay: number | null = null;
    let changedPlanningShift: string | null = null;
    let planningDiff: number = 0;
    let oldPlanning: number | undefined = undefined;
    let newPlanning: number | undefined = undefined;
    // Find which row is being edited and if planningPcs changed
    const editedRow = schedule.find((item) => item.id === itemId);
    if (
      editedRow &&
      editForm.planningPcs !== undefined &&
      editForm.planningPcs !== editedRow.planningPcs
    ) {
      changedPlanningDay = editedRow.day;
      changedPlanningShift = editedRow.shift;
      oldPlanning = editedRow.planningPcs ?? 0;
      newPlanning = editForm.planningPcs;
      planningDiff = newPlanning - oldPlanning;
    }

    // Regenerasi schedule sesuai logika planning PCS, stock, shortfall, overtime
    const waktuKerjaShift = 7; // jam kerja per shift
    let timePerPcs = form.timePerPcs;
    const kapasitasShift = Math.floor((waktuKerjaShift * 3600) / timePerPcs);
    let sisaStock = form.stock;
    let shortfall = 0;
    let overtimeRows: ScheduleItem[] = [];
    const scheduleList: ScheduleItem[] = [];
    for (let d = 1; d <= 30; d++) {
      const idShift1 = `${d}-1`;
      const idShift2 = `${d}-2`;
      // Ambil delivery terbaru (shift 1 saja)
      let deliveryShift1 = deliveryMap[idShift1] ?? 0;
      let totalDelivery = deliveryShift1;
      // Kalkulasi planning PCS per shift
      let planningHariIni = Math.min(totalDelivery, sisaStock);
      let planningShift1 = Math.min(
        Math.floor(planningHariIni / 2),
        kapasitasShift,
        sisaStock,
      );
      sisaStock -= planningShift1;
      let planningShift2 = Math.min(
        planningHariIni - planningShift1,
        kapasitasShift,
        sisaStock,
      );
      sisaStock -= planningShift2;

      // --- If this is the edited row, override planningPcs and propagate selisih ---
      if (changedPlanningDay === d && changedPlanningShift === "1") {
        if (editForm.planningPcs !== undefined) {
          planningShift1 = editForm.planningPcs;
        }
      }
      if (changedPlanningDay === d && changedPlanningShift === "2") {
        if (editForm.planningPcs !== undefined) {
          planningShift2 = editForm.planningPcs;
        }
      }

      // --- Propagate selisih to next day's shift 1 ---
      if (
        changedPlanningDay !== null &&
        planningDiff !== 0 &&
        d === changedPlanningDay + 1
      ) {
        planningShift1 += planningDiff;
        // Clamp to non-negative
        if (planningShift1 < 0) planningShift1 = 0;
      }

      // Jika delivery > total produksi hari ini, shortfall
      let shortfallHariIni = totalDelivery - (planningShift1 + planningShift2);
      if (shortfallHariIni > 0) {
        shortfall += shortfallHariIni;
      }
      // Row shift 1
      const oldRow1 = schedule.find((r) => r.id === idShift1);
      // Hitung kekurangan produksi (shortfall hari ini)
      let notes1 =
        oldRow1 && typeof oldRow1.notes === "string" ? oldRow1.notes : "";
      if (shortfallHariIni > 0) {
        notes1 = `Kekurangan produksi hari ini: ${shortfallHariIni} pcs`;
      }
      scheduleList.push({
        ...(oldRow1 ? oldRow1 : {}),
        id: idShift1,
        day: d,
        shift: "1",
        type: "Produksi",
        pcs: planningShift1,
        time: "07:00-15:00",
        processes: "",
        status:
          oldRow1 && typeof oldRow1.status === "string"
            ? oldRow1.status
            : "Normal",
        actualPcs:
          oldRow1 && typeof oldRow1.actualPcs === "number"
            ? oldRow1.actualPcs
            : undefined,
        delivery: deliveryShift1,
        planningPcs: planningShift1,
        overtimePcs: 0,
        notes: notes1,
        // Add selisih info for the edited row
        selisih:
          changedPlanningDay === d &&
          changedPlanningShift === "1" &&
          planningDiff !== 0
            ? planningDiff
            : undefined,
      });
      // Row shift 2
      const oldRow2 = schedule.find((r) => r.id === idShift2);
      // Untuk shift 2, kekurangan produksi hanya dicatat jika shortfallHariIni > 0
      let notes2 =
        oldRow2 && typeof oldRow2.notes === "string" ? oldRow2.notes : "";
      if (shortfallHariIni > 0) {
        notes2 = `Kekurangan produksi hari ini: ${shortfallHariIni} pcs`;
      }
      scheduleList.push({
        ...(oldRow2 ? oldRow2 : {}),
        id: idShift2,
        day: d,
        shift: "2",
        type: "Produksi",
        pcs: planningShift2,
        time: "15:00-23:00",
        processes: "",
        status:
          oldRow2 && typeof oldRow2.status === "string"
            ? oldRow2.status
            : "Normal",
        actualPcs:
          oldRow2 && typeof oldRow2.actualPcs === "number"
            ? oldRow2.actualPcs
            : undefined,
        delivery: undefined,
        planningPcs: planningShift2,
        overtimePcs: 0,
        notes: notes2,
        selisih:
          changedPlanningDay === d &&
          changedPlanningShift === "2" &&
          planningDiff !== 0
            ? planningDiff
            : undefined,
      });
      // Setiap 3 hari, shortfall dijadwalkan sebagai lembur 2 hari kemudian
      if (d % 3 === 0 && shortfall > 0) {
        const lemburDay = d + 2;
        if (lemburDay <= 30) {
          overtimeRows.push({
            id: `${lemburDay}-OT`,
            day: lemburDay,
            shift: "-",
            type: "Lembur",
            pcs: shortfall,
            time: "-",
            processes: "",
            status: "Normal",
            delivery: undefined,
            planningPcs: 0,
            overtimePcs: shortfall,
            notes: `Lembur dari shortfall hari ${d - 2} s/d ${d}`,
          });
          sisaStock -= shortfall;
        }
        shortfall = 0;
      }
    }
    // Gabungkan lembur ke schedule utama, urutkan berdasarkan hari
    const allRows = [...scheduleList, ...overtimeRows];
    allRows.sort(
      (a, b) => a.day - b.day || (a.shift || "").localeCompare(b.shift || ""),
    );
    setSchedule(allRows);
    setEditingRow(null);
    setEditForm({});
  };

  const saveSchedule = () => {
    if (!form.part) {
      showAlert("Silakan pilih part terlebih dahulu", "Peringatan");
      return;
    }

    const scheduleName = getScheduleName();

    // Check if schedule already exists for this part and month/year
    const existingSchedule = savedSchedules.find(
      (s) => s.form.part === form.part && s.name === scheduleName,
    );

    if (existingSchedule) {
      showConfirm(
        `Laporan ${scheduleName} untuk part ${form.part} sudah ada. Apakah Anda ingin menimpanya?`,
        () => {
          // Remove existing schedule
          const updatedSchedules = savedSchedules.filter(
            (s) => s.id !== existingSchedule.id,
          );
          setSavedSchedules(updatedSchedules);

          const newSchedule: SavedSchedule = {
            id: Date.now().toString(),
            name: scheduleName,
            date: new Date().toLocaleDateString(),
            form: { ...form },
            schedule: [...schedule],
          };

          const finalSchedules = [...updatedSchedules, newSchedule];
          setSavedSchedules(finalSchedules);
          localStorage.setItem(
            "savedSchedules",
            JSON.stringify(finalSchedules),
          );
          showSuccess("Schedule berhasil diperbarui!");
        },
        "Konfirmasi Timpa",
        "Ya, Timpa",
        "Batal",
      );
    } else {
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
      showSuccess("Schedule berhasil disimpan!");
    }
  };

  // Load a saved schedule into the current state
  const loadSchedule = (savedSchedule: SavedSchedule) => {
    setForm(savedSchedule.form);
    setSchedule(savedSchedule.schedule);
    setShowSavedSchedules(false);
    setTimeout(() => {
      const tableSection = document.getElementById("schedule-table-section");
      if (tableSection) {
        tableSection.scrollIntoView({ behavior: "smooth", block: "center" });
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
    <div className="w-full min-h-screen flex items-start justify-center pt-20">
      {/* SchedulerPage main content */}
      <div className="w-full max-w-none mx-auto px-2 sm:px-4 lg:px-6 ">
        {/* Main content below */}
        {/* ...existing code... */}
        {/* Add New Production Planning Button (below navbar) */}
        {showAddButton && (
          <div className="flex justify-start mt-6 px-8">
            <button
              onClick={() => setShowProductionForm(true)}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Tambah Penjadwalan Baru
            </button>
          </div>
        )}
        {/* Saved Schedules Modal */}
        {showSavedSchedules && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div
              className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl mx-4 relative border border-gray-800 animate-fadeInUp overflow-y-auto"
              style={{ maxWidth: "600px", maxHeight: "90vh" }}
            >
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-red-400 text-2xl font-bold z-10"
                onClick={() => setShowSavedSchedules(false)}
                aria-label="Tutup"
              >
                ×
              </button>
              <div className="p-8">
                <h2 className="text-xl font-bold text-white mb-4">
                  Jadwal Tersimpan
                </h2>
                {savedSchedules.length === 0 ? (
                  <div className="text-gray-400">
                    Belum ada jadwal yang disimpan.
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {savedSchedules.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3"
                      >
                        <div>
                          <div className="font-semibold text-white">
                            {s.name}
                          </div>
                          <div className="text-xs text-gray-400">{s.date}</div>
                        </div>
                        <div className="flex gap-2">
                          // Di bagian tombol "Tampilkan" dalam modal Saved
                          Schedules (sekitar baris 604-605):
                          <button
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                            onClick={() => {
                              loadSchedule(s);
                              navigate("/scheduler");
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
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
            onClick={() => setShowProductionForm(false)}
          >
            <div
              className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl mx-4 relative border border-gray-800 animate-fadeInUp overflow-y-auto"
              style={{ maxWidth: "800px", maxHeight: "90vh" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-red-400 text-2xl font-bold z-10"
                onClick={() => setShowProductionForm(false)}
                aria-label="Tutup"
              >
                ×
              </button>
              <ProductionForm
                form={form}
                scheduleName={getScheduleName()}
                setScheduleName={() => {}}
                handleSelectPart={handleSelectPart}
                handleChange={handleChange}
                mockData={mockData}
                isGenerating={isGenerating}
                generateSchedule={() => {
                  generateSchedule();
                  setShowProductionForm(false);
                }}
                saveSchedule={saveSchedule}
                manpowers={form.manpowers}
                addManPower={addManPower}
                removeManPower={removeManPower}
              />
            </div>
          </div>
        )}

        {/* If no schedule, show blank state */}
        {schedule.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[600px] bg-gray-900 border border-gray-800 rounded-3xl p-16 mx-auto max-w-4xl">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-white mb-4">
                Jadwal Produksi belum dibuat
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Lakukan penjadwalan sekarang
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowProductionForm(true)}
                  className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Tambah Penjadwalan
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            id="schedule-table-section"
            className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden"
          >
            {/* Edit Production Form Button */}
            <div className="flex justify-end px-8 pt-6">
              <button
                onClick={() => setShowProductionForm(true)}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 focus:ring-4 focus:ring-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Production Form
              </button>
            </div>
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
                  {/* Month/Year Picker */}
                  <div className="relative">
                    <button
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="font-medium">{getScheduleName()}</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${showDatePicker ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {showDatePicker && (
                      <CompactDatePicker
                        selectedMonth={selectedMonth}
                        selectedYear={selectedYear}
                        onMonthChange={setSelectedMonth}
                        onYearChange={setSelectedYear}
                        onClose={() => setShowDatePicker(false)}
                      />
                    )}
                  </div>

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

            <div className="p-4">
              <ScheduleTable
                schedule={schedule}
                editingRow={editingRow}
                editForm={editForm}
                startEdit={startEdit}
                saveEdit={saveEdit}
                cancelEdit={cancelEdit}
                setEditForm={setEditForm}
                initialStock={form.stock}
              />
            </div>
          </div>
        )}

        {/* Modal component */}
        <Modal
          isOpen={notification.isOpen}
          onClose={hideNotification}
          title={notification.title}
          type={notification.type}
          onConfirm={notification.onConfirm}
          confirmText={notification.confirmText}
          cancelText={notification.cancelText}
        >
          {notification.message}
        </Modal>
      </div>
    </div>
  );
};

export default SchedulerPage;
