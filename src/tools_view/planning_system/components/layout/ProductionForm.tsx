import React, { useState } from "react";
import { MONTHS } from "../../utils/scheduleDateUtils";
import { useTheme } from "../../../contexts/ThemeContext";
import { useSchedule } from "../../contexts/ScheduleContext";
import {
  PlanningSystemService,
  ProductPlanningData,
} from "../../../../services/API_Services";
import Modal from "../ui/Modal";
import { generateScheduleFromForm } from "../../utils/scheduleCalcUtils";
import { useNotification } from "../../../../hooks/useNotification";

// Singkatan bulan untuk dropdown
const MONTH_ABBREVIATIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

interface FormData {
  part: string;
  customer: string;
  stock: number;
  partImage?: File | null;
  timePerPcs?: number;
}

interface ProductionFormProps {
  form: FormData;
  scheduleName: string;
  isGenerating: boolean;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  generateSchedule: () => void;
  setScheduleName: (name: string) => void;
  saveSchedule: () => void;
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  onSaveToBackend?: (data: ProductPlanningData) => Promise<void>;
  onClose?: () => void;
  onSuccess?: (message?: string) => void;
}

const ProductionForm: React.FC<ProductionFormProps> = ({
  form,
  scheduleName,
  isGenerating,
  handleChange,
  generateSchedule,
  setScheduleName,
  saveSchedule,
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear,
  onSaveToBackend,
  onClose,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const { showAlert, showSuccess, showError, notification, hideNotification } =
    useNotification();
  const {
    savedSchedules,
    setSavedSchedules,
    checkExistingSchedule,
    saveSchedulesToStorage,
  } = useSchedule();
  const today = new Date();
  const [errors, setErrors] = useState<{ part?: string; customer?: string }>(
    {},
  );
  const [partImagePreview, setPartImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingScheduleData, setPendingScheduleData] =
    useState<ProductPlanningData | null>(null);

  // Handler untuk generate schedule dengan bulan & tahun dan auto save ke database
  const handleGenerateSchedule = async () => {
    // Validasi form
    const newErrors: { part?: string; customer?: string } = {};

    if (!form.part.trim()) {
      newErrors.part = "Part name harus diisi";
    }

    if (!form.customer.trim()) {
      newErrors.customer = "Customer name harus diisi";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Persiapkan data untuk backend
    const planningData: ProductPlanningData = {
      partName: form.part.trim(),
      customerName: form.customer.trim(),
      productionMonth: selectedMonth + 1, // Konversi ke format 1-12
      productionYear: selectedYear,
      currentStock: form.stock || 0,
    };

    // Cek apakah jadwal sudah ada untuk part, customer, bulan, dan tahun yang sama
    const existingSchedule = checkExistingSchedule(
      form.part.trim(),
      selectedMonth,
      selectedYear,
      form.customer.trim(),
    );

    if (existingSchedule) {
      // Tampilkan modal konfirmasi
      setPendingScheduleData(planningData);
      setShowConfirmationModal(true);
      return;
    }

    // Jika tidak ada jadwal yang sama, langsung proses
    await processScheduleGeneration(planningData);
  };

  // Fungsi untuk memproses pembuatan jadwal
  const processScheduleGeneration = async (
    planningData: ProductPlanningData,
  ) => {
    setScheduleName(`${MONTHS[selectedMonth]} ${selectedYear}`);
    setIsSaving(true);

    try {
      // Cek apakah jadwal sudah ada untuk part, customer, bulan, dan tahun yang sama
      const existingSchedule = checkExistingSchedule(
        form.part.trim(),
        selectedMonth,
        selectedYear,
        form.customer.trim(),
      );

      // Simpan ke backend menggunakan upsert agar tidak membuat duplikasi
      await PlanningSystemService.upsertProductPlanning(planningData);

      // Generate schedule untuk disimpan ke Saved Schedules (bukan langsung tampil dashboard)
      const generatedSchedule = generateScheduleFromForm(
        {
          ...form,
          stock: planningData.currentStock,
          timePerPcs: form.timePerPcs || 257,
        },
        [],
      );

      // Buat ID yang konsisten berdasarkan part, customer, bulan, dan tahun
      const scheduleId =
        `${planningData.partName}-${planningData.customerName}-${selectedMonth}-${selectedYear}`
          .replace(/\s+/g, "-")
          .toLowerCase();

      // Simpan ke state saved schedules
      const newSchedule = {
        id: scheduleId,
        name: `${MONTHS[selectedMonth]} ${selectedYear}`,
        date: new Date().toISOString(),
        form: {
          part: planningData.partName,
          customer: planningData.customerName,
          stock: planningData.currentStock,
          timePerPcs: 257, // Default value
          initialStock: planningData.currentStock,
          partImageUrl: partImagePreview || (form as any).partImageUrl || null,
        },
        schedule: generatedSchedule,
        productInfo: {
          partName: planningData.partName,
          customer: planningData.customerName,
          lastSavedBy: undefined, // Untuk jadwal baru, tidak ada lastSavedBy
          lastSavedAt: new Date().toISOString(),
        },
      };

      // Update saved schedules - timpa jadwal lama jika ada, atau tambah baru
      setSavedSchedules((prev) => {
        // Cari jadwal yang sudah ada dengan ID yang sama
        const existingIndex = prev.findIndex(
          (schedule) => schedule.id === scheduleId,
        );

        let updatedSchedules;
        if (existingIndex !== -1) {
          // Timpa jadwal yang sudah ada
          updatedSchedules = [...prev];
          updatedSchedules[existingIndex] = newSchedule;
        } else {
          // Tambah jadwal baru
          updatedSchedules = [...prev, newSchedule];
        }

        // Simpan ke localStorage
        saveSchedulesToStorage(updatedSchedules);
        return updatedSchedules;
      });

      if (onSuccess) onSuccess("Jadwal berhasil digenerate!");
      // Tidak langsung tutup modal, biarkan user melihat jadwal di card view dulu
      // if (onClose) onClose();
    } catch (error) {
      console.error("Error saving to backend:", error);
      showError("Gagal menyimpan data ke database. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handler untuk konfirmasi pembuatan jadwal baru
  const handleConfirmNewSchedule = async () => {
    if (pendingScheduleData) {
      await processScheduleGeneration(pendingScheduleData);
      setPendingScheduleData(null);
      setShowConfirmationModal(false); // Tutup modal konfirmasi
    }
  };

  // Handler untuk date picker
  const handleDateChange = (date: Date) => {
    setSelectedMonth(date.getMonth());
    setSelectedYear(date.getFullYear());
  };

  // Handler untuk upload gambar part
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi ukuran file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert("Ukuran file terlalu besar. Maksimal 5MB.", "Peringatan");
        return;
      }

      // Validasi tipe file
      if (!file.type.startsWith("image/")) {
        showAlert("File harus berupa gambar.", "Peringatan");
        return;
      }

      // Update form
      handleChange({
        target: { name: "partImage", value: file },
      } as unknown as React.ChangeEvent<HTMLInputElement>);

      // Preview gambar
      const reader = new FileReader();
      reader.onload = (e) => {
        setPartImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler untuk hapus gambar
  const handleRemoveImage = () => {
    setPartImagePreview(null);
    handleChange({
      target: { name: "partImage", value: null },
    } as unknown as React.ChangeEvent<HTMLInputElement>);
  };

  // Theme colors yang lebih clean
  const colors = {
    bg: {
      primary: theme === "dark" ? "bg-gray-900" : "bg-white",
      secondary: theme === "dark" ? "bg-gray-800" : "bg-gray-50",
      card: theme === "dark" ? "bg-gray-800" : "bg-white",
      header: theme === "dark" ? "bg-gray-800" : "bg-gray-50",
    },
    border: {
      primary: theme === "dark" ? "border-gray-700" : "border-gray-200",
      secondary: theme === "dark" ? "border-gray-600" : "border-gray-300",
      accent: theme === "dark" ? "border-blue-500" : "border-blue-300",
      error: theme === "dark" ? "border-red-500" : "border-red-300",
    },
    text: {
      primary: theme === "dark" ? "text-white" : "text-gray-900",
      secondary: theme === "dark" ? "text-gray-300" : "text-gray-600",
      muted: theme === "dark" ? "text-gray-400" : "text-gray-500",
      accent: theme === "dark" ? "text-blue-400" : "text-blue-600",
      error: theme === "dark" ? "text-red-400" : "text-red-600",
    },
    input: {
      bg: theme === "dark" ? "bg-gray-800" : "bg-white",
      border: theme === "dark" ? "border-gray-600" : "border-gray-300",
      focus:
        theme === "dark"
          ? "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          : "focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50",
      placeholder:
        theme === "dark" ? "placeholder-gray-500" : "placeholder-gray-400",
      error: theme === "dark" ? "border-red-500" : "border-red-300",
    },
    select: {
      bg: theme === "dark" ? "bg-gray-800" : "bg-white",
      border: theme === "dark" ? "border-gray-600" : "border-gray-300",
      text: theme === "dark" ? "text-white" : "text-gray-900",
      focus:
        theme === "dark"
          ? "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          : "focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50",
    },
    button: {
      primary:
        "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700",
      secondary:
        theme === "dark"
          ? "bg-gray-700 hover:bg-gray-600"
          : "bg-gray-200 hover:bg-gray-300",
      danger:
        "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800",
    },
  };

  // Professional Production Period Selector
  const ProductionPeriodSelector = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempMonth, setTempMonth] = useState(selectedMonth);
    const [tempYear, setTempYear] = useState(selectedYear);

    // Update temp values when popup opens
    React.useEffect(() => {
      if (isOpen) {
        setTempMonth(selectedMonth);
        setTempYear(selectedYear);
      }
    }, [isOpen, selectedMonth, selectedYear]);

    const handleMonthSelect = (month: number) => {
      setTempMonth(month);
    };

    const handleYearChange = (direction: "prev" | "next") => {
      const newYear = direction === "prev" ? tempYear - 1 : tempYear + 1;
      setTempYear(newYear);
    };

    return (
      <div className="relative z-10">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 ${colors.select.bg} border ${colors.select.border} rounded-lg ${colors.select.focus} ${colors.select.text} transition-all duration-200 text-xs font-medium flex items-center justify-between`}
        >
          <span>
            {MONTHS[selectedMonth]} {selectedYear}
          </span>
          <svg
            className="w-4 h-4 text-gray-400"
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
        </button>

        {isOpen && (
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl w-full max-w-sm p-4">
              {/* Year Navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => handleYearChange("prev")}
                  className="p-1 hover:bg-gray-700 rounded transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4 text-gray-400 hover:text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <div className="text-center">
                  <span className="text-white font-bold text-xl">
                    {tempYear}
                  </span>
                </div>

                <button
                  onClick={() => handleYearChange("next")}
                  className="p-1 hover:bg-gray-700 rounded transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4 text-gray-400 hover:text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              {/* Month Selection */}
              <div className="grid grid-cols-3 gap-1 mb-3">
                {MONTH_ABBREVIATIONS.map((monthAbbr, index) => (
                  <button
                    key={index}
                    onClick={() => handleMonthSelect(index)}
                    className={`p-2 rounded text-sm font-medium transition-all duration-200 ${
                      tempMonth === index
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    {monthAbbr}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setTempMonth(selectedMonth);
                    setTempYear(selectedYear);
                    setIsOpen(false);
                  }}
                  className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded transition-colors duration-200 text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setSelectedMonth(tempMonth);
                    setSelectedYear(tempYear);
                    setScheduleName(`${MONTHS[tempMonth]} ${tempYear}`);
                    setIsOpen(false);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors duration-200 text-sm"
                >
                  Pilih
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div
        className={`${colors.bg.header} border-b ${colors.border.primary} px-4 sm:px-6 py-3 sm:py-4`}
      >
        <div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <h2
                className={`text-lg sm:text-xl font-bold ${colors.text.primary}`}
              >
                Production Configuration
              </h2>
              <p className={`${colors.text.secondary} text-xs sm:text-sm`}>
                Configure your manufacturing parameters
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${theme === "dark" ? "bg-transparent" : "bg-white"} p-4 sm:p-6 space-y-4 sm:space-y-6 rounded-b-3xl`}
      >
        {/* 2x2 Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Top Left - Production Period */}
          <div
            className={`${colors.bg.card} border ${colors.border.secondary} rounded-xl sm:rounded-2xl p-3 sm:p-4 relative z-10`}
          >
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 text-white"
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
              <h3
                className={`text-sm sm:text-base font-semibold ${colors.text.primary}`}
              >
                Production Period
              </h3>
            </div>

            <div className="space-y-1">
              <label
                className={`block text-sm font-medium ${colors.text.secondary}`}
              >
                Select Month & Year
              </label>
              <ProductionPeriodSelector />
            </div>
          </div>

          {/* Top Right - Production Targets */}
          <div
            className={`${colors.bg.card} border ${colors.border.secondary} rounded-xl sm:rounded-2xl p-3 sm:p-4`}
          >
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3
                className={`text-sm sm:text-base font-semibold ${colors.text.primary}`}
              >
                Production Targets
              </h3>
            </div>

            <div className="space-y-1">
              <label
                className={`block text-sm font-medium ${colors.text.secondary}`}
              >
                Current Stock
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 pr-6 sm:pr-8 ${colors.input.bg} border ${colors.input.border} rounded-lg ${colors.input.focus} transition-all duration-200 ${colors.text.primary} ${colors.input.placeholder} text-sm font-medium`}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <span className={`text-sm font-medium ${colors.text.muted}`}>
                    PCS
                  </span>
                </div>
              </div>
              <p className={`text-sm ${colors.text.muted} mt-1`}>
                Current inventory available
              </p>
            </div>
          </div>

          {/* Bottom Left - Product Information */}
          <div
            className={`${colors.bg.card} border ${colors.border.secondary} rounded-xl sm:rounded-2xl p-3 sm:p-4 relative z-0`}
          >
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3
                className={`text-sm sm:text-base font-semibold ${colors.text.primary}`}
              >
                Product Information
              </h3>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div className="space-y-1">
                <label
                  className={`block text-sm font-medium ${colors.text.secondary}`}
                >
                  Part Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="part"
                    value={form.part}
                    onChange={handleChange}
                    placeholder="Enter part name"
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 ${colors.input.bg} border ${errors.part ? colors.input.error : colors.input.border} rounded-lg ${colors.input.focus} transition-all duration-200 ${colors.text.primary} ${colors.input.placeholder} text-sm font-medium`}
                    required
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                  </div>
                </div>
                {errors.part && (
                  <p className={`text-xs ${colors.text.error} mt-1`}>
                    {errors.part}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label
                  className={`block text-sm font-medium ${colors.text.secondary}`}
                >
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="customer"
                    value={form.customer}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 ${colors.input.bg} border ${errors.customer ? colors.input.error : colors.input.border} rounded-lg ${colors.input.focus} transition-all duration-200 ${colors.text.primary} ${colors.input.placeholder} text-sm font-medium`}
                    required
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
                {errors.customer && (
                  <p className={`text-xs ${colors.text.error} mt-1`}>
                    {errors.customer}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Right - Part Image Upload */}
          <div
            className={`${colors.bg.card} border ${colors.border.secondary} rounded-xl sm:rounded-2xl p-3 sm:p-4`}
          >
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3
                className={`text-sm sm:text-base font-semibold ${colors.text.primary}`}
              >
                Part Image
              </h3>
            </div>

            <div className="space-y-3">
              {partImagePreview ? (
                <div className="relative">
                  <img
                    src={partImagePreview}
                    alt="Part preview"
                    className="w-full h-24 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
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
                <div
                  className={`${
                    theme === "dark"
                      ? "border-gray-600 bg-gray-800/40"
                      : "border-gray-300 bg-gray-50"
                  } border-2 border-dashed rounded-lg p-5 text-center transition-all`}
                >
                  <svg
                    className="w-8 h-8 mx-auto text-gray-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className={`text-sm ${colors.text.muted}`}>
                    Upload part image (optional)
                  </p>
                  <p className={`text-xs ${colors.text.muted} mt-1`}>
                    Max 5MB, JPG/PNG
                  </p>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="part-image-upload"
              />
              <label
                htmlFor="part-image-upload"
                className={`block w-full px-4 py-3 text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg cursor-pointer transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                {partImagePreview ? "Change Image" : "Upload Image"}
              </label>
            </div>
          </div>
        </div>

        {/* Generate Button - Full Width Below Grid */}
        <div className="pt-2">
          <button
            onClick={handleGenerateSchedule}
            disabled={isGenerating || isSaving}
            className={`w-full px-6 sm:px-8 py-3 sm:py-4 ${colors.button.primary} text-white font-bold text-sm sm:text-base rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-300/30 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-xl`}
          >
            {isGenerating || isSaving ? (
              <>
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Membuat Jadwal...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>Generate Jadwal</span>
              </>
            )}
          </button>
        </div>
      </div>
      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmationModal}
        onClose={() => {
          setShowConfirmationModal(false);
          setPendingScheduleData(null);
        }}
        title="⚠️ Jadwal Sudah Ada"
        type="confirm"
        onConfirm={handleConfirmNewSchedule}
        confirmText="Ya, Buat Jadwal Baru"
        cancelText="Batal"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Jadwal produksi untuk{" "}
            <strong>{pendingScheduleData?.partName}</strong> pada bulan{" "}
            <strong>
              {MONTHS[selectedMonth]} {selectedYear}
            </strong>{" "}
            sudah ada dalam sistem.
          </p>
          <p className="text-gray-400 text-sm">
            Apakah Anda ingin membuat jadwal baru untuk menggantikan jadwal yang
            sudah ada?
          </p>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-blue-400 text-sm">
              <strong>Info:</strong> Jadwal lama akan ditimpa dengan data yang
              baru.
            </p>
          </div>
        </div>
      </Modal>

      {/* Notification Modal */}
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
  );
};

export default ProductionForm;
