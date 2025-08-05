import React, { useState } from "react";
import { MONTHS } from "../../utils/scheduleDateUtils";
import { useTheme } from "../../../contexts/ThemeContext";

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
}) => {
  const { theme } = useTheme();
  const today = new Date();
  const [errors, setErrors] = useState<{ part?: string; customer?: string }>(
    {},
  );

  // Handler untuk generate schedule dengan bulan & tahun
  const handleGenerateSchedule = () => {
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
    setScheduleName(`${MONTHS[selectedMonth]} ${selectedYear}`);

    // Generate schedule hanya di frontend, tidak perlu backend
    generateSchedule();
  };

  // Handler untuk date picker
  const handleDateChange = (date: Date) => {
    setSelectedMonth(date.getMonth());
    setSelectedYear(date.getFullYear());
  };

  // Theme colors dengan gradient yang lebih menarik
  const colors = {
    bg: {
      primary:
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-white via-gray-50 to-white",
      secondary: theme === "dark" ? "bg-gray-800/50" : "bg-gray-50/50",
      card:
        theme === "dark"
          ? "bg-gray-800/80 backdrop-blur-sm"
          : "bg-white/80 backdrop-blur-sm",
      header:
        theme === "dark"
          ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20"
          : "bg-gradient-to-r from-blue-50 to-purple-50",
    },
    border: {
      primary: theme === "dark" ? "border-gray-700/50" : "border-gray-200/50",
      secondary: theme === "dark" ? "border-gray-600/30" : "border-gray-300/30",
      accent: theme === "dark" ? "border-blue-500/30" : "border-blue-300/30",
      error: theme === "dark" ? "border-red-500/50" : "border-red-300/50",
    },
    text: {
      primary: theme === "dark" ? "text-white" : "text-gray-900",
      secondary: theme === "dark" ? "text-gray-300" : "text-gray-600",
      muted: theme === "dark" ? "text-gray-400" : "text-gray-500",
      accent: theme === "dark" ? "text-blue-400" : "text-blue-600",
      error: theme === "dark" ? "text-red-400" : "text-red-600",
    },
    input: {
      bg:
        theme === "dark"
          ? "bg-gray-800/80 backdrop-blur-sm"
          : "bg-white/80 backdrop-blur-sm",
      border: theme === "dark" ? "border-gray-600/50" : "border-gray-300/50",
      focus:
        theme === "dark"
          ? "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          : "focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50",
      placeholder:
        theme === "dark" ? "placeholder-gray-500" : "placeholder-gray-400",
      error: theme === "dark" ? "border-red-500/50" : "border-red-300/50",
    },
    select: {
      bg:
        theme === "dark"
          ? "bg-gray-800/80 backdrop-blur-sm"
          : "bg-white/80 backdrop-blur-sm",
      border: theme === "dark" ? "border-gray-600/50" : "border-gray-300/50",
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
          ? "bg-gray-700/80 hover:bg-gray-600/80 backdrop-blur-sm"
          : "bg-gray-200/80 hover:bg-gray-300/80 backdrop-blur-sm",
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
      // Popup tetap terbuka, tidak menutup otomatis
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-lg shadow-2xl w-full max-w-xs p-3">
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
                  <span className="text-white font-bold text-lg">
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
                    className={`p-1.5 rounded text-xs font-medium transition-all duration-200 ${
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
                  className="flex-1 px-2 py-1.5 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded transition-colors duration-200 text-xs"
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
                  className="flex-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors duration-200 text-xs"
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
    <div
      className={`${colors.bg.primary} border ${colors.border.primary} rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm max-h-screen`}
    >
      {/* Header dengan gradient yang menarik */}
      <div
        className={`${colors.bg.header} border-b ${colors.border.primary} px-4 sm:px-6 py-3 sm:py-4 relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
        <div className="relative z-10">
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

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Compact Layout - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column - Production Period & Product Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Production Period - Calendar Style */}
            <div
              className={`${colors.bg.card} border ${colors.border.secondary} rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm relative z-10`}
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
                  className={`text-xs sm:text-sm font-semibold ${colors.text.primary}`}
                >
                  Production Period
                </h3>
              </div>

              {/* Production Period Selector */}
              <div className="space-y-1">
                <label
                  className={`block text-xs font-medium ${colors.text.secondary}`}
                >
                  Select Month & Year
                </label>
                <ProductionPeriodSelector />
              </div>
            </div>

            {/* Product Information */}
            <div
              className={`${colors.bg.card} border ${colors.border.secondary} rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm relative z-0`}
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
                  className={`text-xs sm:text-sm font-semibold ${colors.text.primary}`}
                >
                  Product Information
                </h3>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="space-y-1">
                  <label
                    className={`block text-xs font-medium ${colors.text.secondary}`}
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
                      className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 ${colors.input.bg} border ${errors.part ? colors.input.error : colors.input.border} rounded-lg ${colors.input.focus} transition-all duration-200 ${colors.text.primary} ${colors.input.placeholder} text-xs font-medium`}
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
                    className={`block text-xs font-medium ${colors.text.secondary}`}
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
                      className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 ${colors.input.bg} border ${errors.customer ? colors.input.error : colors.input.border} rounded-lg ${colors.input.focus} transition-all duration-200 ${colors.text.primary} ${colors.input.placeholder} text-xs font-medium`}
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
          </div>

          {/* Right Column - Production Targets & Action Button */}
          <div className="space-y-4 sm:space-y-6">
            {/* Production Targets */}
            <div
              className={`${colors.bg.card} border ${colors.border.secondary} rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm`}
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
                  className={`text-xs sm:text-sm font-semibold ${colors.text.primary}`}
                >
                  Production Targets
                </h3>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="space-y-1">
                  <label
                    className={`block text-xs font-medium ${colors.text.secondary}`}
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
                      className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 pr-6 sm:pr-8 ${colors.input.bg} border ${colors.input.border} rounded-lg ${colors.input.focus} transition-all duration-200 ${colors.text.primary} ${colors.input.placeholder} text-xs font-medium`}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <span
                        className={`text-xs font-medium ${colors.text.muted}`}
                      >
                        PCS
                      </span>
                    </div>
                  </div>
                  <p className={`text-xs ${colors.text.muted} mt-1`}>
                    Current inventory available
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <button
                onClick={handleGenerateSchedule}
                disabled={isGenerating}
                className={`w-full px-4 sm:px-6 py-2.5 sm:py-3 ${colors.button.primary} text-white font-bold text-xs sm:text-sm rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-300/30 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-xl backdrop-blur-sm`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Generating...</span>
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
                    <span>Generate Schedule</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionForm;
