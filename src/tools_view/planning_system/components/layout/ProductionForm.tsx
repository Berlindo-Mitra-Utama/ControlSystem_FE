import React, { useState } from "react";
import { MONTHS } from "../../utils/scheduleDateUtils";
import { useTheme } from "../../../contexts/ThemeContext";

interface FormData {
  part: string;
  customer: string;
  timePerPcs: number;
  cycle1: number;
  cycle7: number;
  cycle35: number;
  stock: number;
  // delivery: number; // REMOVED, now per-row in schedule
  planningHour: number;
  overtimeHour: number;
  planningPcs: number;
  overtimePcs: number;
  isManualPlanningPcs: boolean;
}

interface ProductionFormProps {
  form: FormData & { manpowers?: string[] };
  scheduleName: string;
  mockData: any[];
  isGenerating: boolean;
  handleSelectPart: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  generateSchedule: () => void;
  setScheduleName: (name: string) => void;
  saveSchedule: () => void;
  manpowers?: string[];
  addManPower?: (name: string) => void;
  removeManPower?: (name: string) => void;
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
}

const ProductionForm: React.FC<ProductionFormProps> = ({
  form,
  scheduleName,
  mockData,
  isGenerating,
  handleSelectPart,
  handleChange,
  generateSchedule,
  setScheduleName,
  saveSchedule,
  manpowers,
  addManPower,
  removeManPower,
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear,
}) => {
  const { theme } = useTheme();
  const [manPowerName, setManPowerName] = useState("");
  const [showError, setShowError] = useState(false);
  const today = new Date();

  // Use manpowers from props or from form
  const manPowers = manpowers || form.manpowers || [];

  // Calculate effective time per pcs based on man power
  const effectiveTimePerPcs =
    form.timePerPcs > 0 && manPowers.length > 0
      ? 3600 / (manPowers.length * 5)
      : form.timePerPcs;

  // Handler for adding man power (calls parent handler)
  const handleAddManPower = () => {
    const name = manPowerName.trim();
    if (name && !manPowers.includes(name) && addManPower) {
      addManPower(name);
      setManPowerName("");
    }
  };

  // Handler for removing man power (calls parent handler)
  const handleRemoveManPower = (name: string) => {
    if (removeManPower) {
      removeManPower(name);
    }
  };

  // Handler untuk generate schedule dengan bulan & tahun
  const handleGenerateSchedule = () => {
    if (!form.part) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }
    setScheduleName(`${MONTHS[selectedMonth]} ${selectedYear}`);
    generateSchedule();
  };

  // Theme colors
  const colors = {
    bg: {
      primary: theme === "dark" ? "bg-gray-900" : "bg-white",
      secondary: theme === "dark" ? "bg-gray-800" : "bg-gray-50",
      card: theme === "dark" ? "bg-gray-800" : "bg-white",
    },
    border: {
      primary: theme === "dark" ? "border-gray-800" : "border-gray-200",
      secondary: theme === "dark" ? "border-gray-700" : "border-gray-300",
    },
    text: {
      primary: theme === "dark" ? "text-white" : "text-gray-900",
      secondary: theme === "dark" ? "text-gray-300" : "text-gray-600",
      muted: theme === "dark" ? "text-gray-400" : "text-gray-500",
    },
    input: {
      bg: theme === "dark" ? "bg-gray-800" : "bg-white",
      border: theme === "dark" ? "border-gray-700" : "border-gray-300",
      focus:
        theme === "dark"
          ? "focus:ring-blue-500 focus:border-blue-500"
          : "focus:ring-blue-500 focus:border-blue-500",
      placeholder:
        theme === "dark" ? "placeholder-gray-500" : "placeholder-gray-400",
    },
    select: {
      bg: theme === "dark" ? "bg-gray-800" : "bg-white",
      border: theme === "dark" ? "border-gray-700" : "border-gray-300",
      text: theme === "dark" ? "text-white" : "text-gray-900",
      focus:
        theme === "dark"
          ? "focus:ring-blue-500 focus:border-blue-500"
          : "focus:ring-blue-500 focus:border-blue-500",
    },
    button: {
      primary:
        "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
      secondary:
        theme === "dark"
          ? "bg-gray-700 hover:bg-gray-600"
          : "bg-gray-200 hover:bg-gray-300",
      danger: "bg-red-600 hover:bg-red-700",
    },
  };

  return (
    <div
      className={`${colors.bg.primary} border ${colors.border.primary} rounded-3xl overflow-hidden`}
    >
      <div
        className={`border-b ${colors.border.primary} px-4 sm:px-8 py-4 sm:py-6`}
      >
        <h2 className={`text-xl sm:text-2xl font-bold ${colors.text.primary}`}>
          Production Configuration
        </h2>
        <p className={`${colors.text.secondary} mt-1 text-sm sm:text-base`}>
          Configure your manufacturing parameters
        </p>
      </div>

      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        {/* Pilih Bulan & Tahun Produksi */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="w-full sm:w-auto">
            <label
              className={`block text-sm font-medium ${colors.text.secondary} mb-1`}
            >
              Bulan Produksi
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg border ${colors.select.border} ${colors.select.bg} ${colors.select.text} ${colors.select.focus} text-sm sm:text-base`}
              data-theme={theme}
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <label
              className={`block text-sm font-medium ${colors.text.secondary} mb-1`}
            >
              Tahun Produksi
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg border ${colors.select.border} ${colors.select.bg} ${colors.select.text} ${colors.select.focus} text-sm sm:text-base`}
              data-theme={theme}
            >
              {Array.from(
                { length: 6 },
                (_, i) => today.getFullYear() - 2 + i,
              ).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Part Selection */}
        <div className="space-y-3 sm:space-y-4">
          <h3
            className={`text-base sm:text-lg font-semibold ${colors.text.primary}`}
          >
            Part Selection
          </h3>
          <div className="relative">
            <select
              value={form.part}
              onChange={handleSelectPart}
              className={`w-full px-3 sm:px-4 py-3 sm:py-4 ${colors.select.bg} border ${colors.select.border} rounded-xl ${colors.select.focus} transition-all duration-200 ${colors.select.text} appearance-none cursor-pointer hover:border-gray-600 text-sm sm:text-base`}
              data-theme={theme}
            >
              <option value="">Select a part to get started...</option>
              {mockData.map((item, idx) => (
                <option key={idx} value={item.part}>
                  {item.part} - {item.customer}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {showError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4">
            <p className="text-red-400 text-sm sm:text-base">
              ⚠️ Please select a part before generating schedule
            </p>
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4 sm:space-y-6">
          <h3
            className={`text-base sm:text-lg font-semibold ${colors.text.primary}`}
          >
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Part Name */}
            <div className="space-y-2 sm:space-y-3">
              <label
                className={`block text-sm font-medium ${colors.text.secondary}`}
              >
                Part Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="part"
                value={form.part}
                onChange={handleChange}
                placeholder="Enter part name"
                className={`w-full px-3 sm:px-4 py-3 sm:py-4 ${colors.input.bg} border ${colors.input.border} rounded-xl ${colors.input.focus} transition-all duration-200 ${colors.text.primary} ${colors.input.placeholder} hover:border-gray-600 text-sm sm:text-base`}
                required
              />
            </div>

            {/* Customer Name */}
            <div className="space-y-2 sm:space-y-3">
              <label
                className={`block text-sm font-medium ${colors.text.secondary}`}
              >
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customer"
                value={form.customer}
                onChange={handleChange}
                placeholder="Enter customer name"
                className={`w-full px-3 sm:px-4 py-3 sm:py-4 ${colors.input.bg} border ${colors.input.border} rounded-xl ${colors.input.focus} transition-all duration-200 ${colors.text.primary} ${colors.input.placeholder} hover:border-gray-600 text-sm sm:text-base`}
                required
              />
            </div>
          </div>
        </div>

        {/* Timing Parameters */}
        <div className="space-y-4 sm:space-y-6">
          <h3
            className={`text-base sm:text-lg font-semibold ${colors.text.primary}`}
          >
            Timing Parameters
          </h3>
          {/* Man Power Input */}
          <div className="mb-4">
            <label
              className={`block text-sm font-medium ${colors.text.secondary} mb-1`}
            >
              Man Power
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={manPowerName}
                onChange={(e) => setManPowerName(e.target.value)}
                placeholder="Nama Man Power"
                className={`px-3 py-2 rounded-lg border ${colors.input.border} ${colors.input.bg} ${colors.text.primary} ${colors.input.focus} text-sm sm:text-base w-full sm:w-1/2`}
              />
              <button
                type="button"
                onClick={handleAddManPower}
                className={`px-3 sm:px-4 py-2 ${colors.button.primary} text-white rounded-lg font-semibold transition-all text-sm sm:text-base`}
              >
                Add
              </button>
            </div>
            {/* List Man Power */}
            {manPowers.length > 0 && (
              <ul className="mt-2 space-y-1">
                {manPowers.map((mp, idx) => (
                  <li
                    key={mp}
                    className={`flex items-center justify-between ${colors.text.primary} ${colors.bg.secondary} rounded px-3 py-1 text-sm sm:text-base`}
                  >
                    <span>
                      {idx + 1}. {mp}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveManPower(mp)}
                      className={`${colors.button.danger} text-white text-xs font-semibold rounded px-2 sm:px-3 py-1 ml-2 transition-colors`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className={`mt-2 text-xs ${colors.text.muted}`}>
              1 Man Power = 5 pcs/jam. Jumlah man power mempengaruhi kecepatan
              produksi.
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Time per Piece */}
            <div className="space-y-2">
              <label
                className={`block text-sm font-medium ${colors.text.secondary} mb-1`}
              >
                Time per Piece (sec)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="timePerPcs"
                  value={
                    manPowers.length > 0
                      ? effectiveTimePerPcs.toFixed(2)
                      : form.timePerPcs
                  }
                  readOnly={manPowers.length > 0}
                  onChange={manPowers.length === 0 ? handleChange : undefined}
                  className={`w-full px-3 py-3 pr-10 ${colors.input.bg} border ${colors.input.border} rounded-lg ${colors.text.primary} text-sm sm:text-base ${manPowers.length > 0 ? "cursor-not-allowed opacity-80" : colors.input.focus}`}
                />
                <span
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs ${colors.text.muted} font-medium`}
                >
                  sec
                </span>
              </div>
            </div>

            {/* Output 1 Jam */}
            <div className="space-y-2">
              <label
                className={`block text-sm font-medium ${colors.text.secondary} mb-1`}
              >
                Output 1 Jam
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={
                    manPowers.length > 0
                      ? manPowers.length * 5
                      : form.timePerPcs > 0
                        ? Math.floor(3600 / form.timePerPcs)
                        : 0
                  }
                  readOnly
                  className={`w-full px-3 py-3 pr-10 ${colors.input.bg} border ${colors.input.border} rounded-lg ${colors.text.primary} text-sm sm:text-base cursor-not-allowed opacity-80`}
                />
                <span
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs ${colors.text.muted} font-medium`}
                >
                  pcs
                </span>
              </div>
            </div>

            {/* Output 7 Jam */}
            <div className="space-y-2">
              <label
                className={`block text-sm font-medium ${colors.text.secondary} mb-1`}
              >
                Output 7 Jam
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={
                    manPowers.length > 0
                      ? manPowers.length * 5 * 7
                      : form.timePerPcs > 0
                        ? Math.floor((3600 * 7) / form.timePerPcs)
                        : 0
                  }
                  readOnly
                  className={`w-full px-3 py-3 pr-10 ${colors.input.bg} border ${colors.input.border} rounded-lg ${colors.text.primary} text-sm sm:text-base cursor-not-allowed opacity-80`}
                />
                <span
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs ${colors.text.muted} font-medium`}
                >
                  pcs
                </span>
              </div>
            </div>

            {/* Output 3.5 Jam */}
            <div className="space-y-2">
              <label
                className={`block text-sm font-medium ${colors.text.secondary} mb-1`}
              >
                Output 3.5 Jam
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={
                    manPowers.length > 0
                      ? manPowers.length * 5 * 3.5
                      : form.timePerPcs > 0
                        ? Math.floor((3600 * 3.5) / form.timePerPcs)
                        : 0
                  }
                  readOnly
                  className={`w-full px-3 py-3 pr-10 ${colors.input.bg} border ${colors.input.border} rounded-lg ${colors.text.primary} text-sm sm:text-base cursor-not-allowed opacity-80`}
                />
                <span
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs ${colors.text.muted} font-medium`}
                >
                  pcs
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Production Targets */}
        <div className="space-y-4 sm:space-y-6">
          <h3
            className={`text-base sm:text-lg font-semibold ${colors.text.primary}`}
          >
            Production Targets
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Input Section */}
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Current Stock */}
                <div className="space-y-2 sm:space-y-3">
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
                      className={`w-full px-3 sm:px-4 py-3 sm:py-4 pr-12 ${colors.input.bg} border ${colors.input.border} rounded-xl ${colors.input.focus} transition-all duration-200 ${colors.text.primary} hover:border-gray-600 text-sm sm:text-base`}
                    />
                    <span
                      className={`absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-sm ${colors.text.muted} font-medium`}
                    >
                      PCS
                    </span>
                  </div>
                </div>

                {/* Delivery Target removed: now per-row in schedule */}
              </div>

              {/* Planning Hours and Overtime Hours removed as requested */}
            </div>

            {/* Output Section removed: Shift Information and Production Calculation */}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center pt-6 sm:pt-8">
          <button
            onClick={handleGenerateSchedule}
            disabled={isGenerating || !form.part}
            className={`px-8 sm:px-12 py-3 sm:py-4 ${colors.button.primary} text-white font-bold text-base sm:text-lg rounded-xl focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 sm:gap-3 shadow-lg`}
          >
            {isGenerating ? (
              <>
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 animate-spin"
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
                <span className="hidden sm:inline">Generating Schedule...</span>
                <span className="sm:hidden">Generating...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
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
                <span className="hidden sm:inline">
                  Generate Production Schedule
                </span>
                <span className="sm:hidden">Generate Schedule</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductionForm;
