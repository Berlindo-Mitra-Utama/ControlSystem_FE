import React, { useState, useEffect } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  Building,
  Calendar,
  Package,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

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

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { month: number; year: number; stock: number }) => void;
  initialData: {
    month: number;
    year: number;
    stock: number;
    partName: string;
    customer: string;
  };
  isLoading?: boolean;
}

const MONTHS = [
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

const EditScheduleModal: React.FC<EditScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const [month, setMonth] = useState(initialData.month);
  const [year, setYear] = useState(initialData.year);
  const [stock, setStock] = useState(initialData.stock);

  useEffect(() => {
    if (isOpen) {
      setMonth(initialData.month);
      setYear(initialData.year);
      setStock(initialData.stock);
    }
  }, [isOpen, initialData]);

  const handleSave = () => {
    onSave({ month, year, stock });
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
        "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
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
    const [tempMonth, setTempMonth] = useState(month);
    const [tempYear, setTempYear] = useState(year);

    // Update temp values when popup opens
    React.useEffect(() => {
      if (isOpen) {
        setTempMonth(month);
        setTempYear(year);
      }
    }, [isOpen, month, year]);

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
            {MONTHS[month]} {year}
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
                    setTempMonth(month);
                    setTempYear(year);
                    setIsOpen(false);
                  }}
                  className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded transition-colors duration-200 text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setMonth(tempMonth);
                    setYear(tempYear);
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
      onClick={onClose}
    >
      <div
        className={`${colors.bg.primary} rounded-3xl shadow-2xl w-full max-w-2xl relative border ${colors.border.primary} animate-fadeInUp overflow-y-auto`}
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
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
                  Edit Production Schedule
                </h2>
                <p className={`${colors.text.secondary} text-xs sm:text-sm`}>
                  Update monthly information and stock for existing schedule
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`${theme === "dark" ? "bg-transparent" : "bg-white"} p-4 space-y-4 rounded-b-3xl`}
        >
          {/* Grid Layout */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {/* Production Period */}
            <div
              className={`${colors.bg.card} border ${colors.border.secondary} rounded-xl p-3 relative z-10`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
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
                <h3 className={`text-sm font-semibold ${colors.text.primary}`}>
                  Production Period
                </h3>
              </div>

              <div className="space-y-1">
                <label
                  className={`block text-xs font-medium ${colors.text.secondary}`}
                >
                  Change Month & Year
                </label>
                <div className="w-full max-w-48">
                  <ProductionPeriodSelector />
                </div>
                <p className={`text-xs ${colors.text.muted} mt-1`}>
                  ⚠️ Changing month/year will update the schedule name
                </p>
              </div>
            </div>

            {/* Production Targets */}
            <div
              className={`${colors.bg.card} border ${colors.border.secondary} rounded-xl p-3`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
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
                <h3 className={`text-sm font-semibold ${colors.text.primary}`}>
                  Production Targets
                </h3>
              </div>

              <div className="space-y-1">
                <label
                  className={`block text-xs font-medium ${colors.text.secondary}`}
                >
                  Update Stock
                </label>
                <div className="relative w-full max-w-32">
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value) || 0)}
                    min="0"
                    placeholder="0"
                    className={`w-full px-3 py-2 pr-8 ${colors.input.bg} border ${colors.input.border} rounded-lg ${colors.input.focus} transition-all duration-200 ${colors.text.primary} ${colors.input.placeholder} text-sm font-medium`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span
                      className={`text-sm font-medium ${colors.text.muted}`}
                    >
                      PCS
                    </span>
                  </div>
                </div>
                <p className={`text-xs ${colors.text.muted} mt-1`}>
                  💡 Update stock value for this schedule
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={`w-full px-6 py-3 ${colors.button.primary} text-white font-bold text-sm rounded-lg focus:ring-4 focus:ring-blue-300/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <>
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
                  <span>✓ Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditScheduleModal;
