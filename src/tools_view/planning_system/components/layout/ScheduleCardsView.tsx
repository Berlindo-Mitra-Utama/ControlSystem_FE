import React, { useState, useEffect, useRef } from "react";
import { ScheduleItem, ScheduleTableProps } from "../../types/scheduleTypes";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  getDayName,
  formatValidDate,
  getMaxDaysInMonth,
  parseScheduleName,
} from "../../utils/scheduleDateUtils";
import {
  calculateOutputFields,
  checkValidation,
  formatJamProduksi,
  calculateAkumulasiDelivery,
  calculateAkumulasiHasilProduksi,
  calculateStockCustom,
} from "../../utils/scheduleCalcUtils";
import StatusBadge from "../ui/StatusBadge";

import {
  Calendar,
  Clock,
  Package,
  Truck,
  Timer,
  Factory,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Loader2,
  Activity,
  Plus,
  Trash2,
  Target,
  Zap,
} from "lucide-react";

interface ScheduleCardsViewProps {
  schedule: ScheduleItem[];
  setEditForm: React.Dispatch<React.SetStateAction<Partial<ScheduleItem>>>;
  initialStock: number;
  timePerPcs: number;
  scheduleName?: string;
  searchDate?: string;
  manpowerList: { id: number; name: string }[];
  setManpowerList: React.Dispatch<
    React.SetStateAction<{ id: number; name: string }[]>
  >;
  newManpower: string;
  setNewManpower: React.Dispatch<React.SetStateAction<string>>;
  handleAddManpower: () => void;
  handleRemoveManpower: (id: number) => void;
}

const ScheduleCardsView: React.FC<ScheduleCardsViewProps> = ({
  schedule,
  setEditForm,
  initialStock,
  timePerPcs = 257,
  scheduleName,
  searchDate = "",
  manpowerList,
  setManpowerList,
  newManpower,
  setNewManpower,
  handleAddManpower,
  handleRemoveManpower,
}) => {
  const { uiColors, theme } = useTheme();
  // State untuk loading popup
  const [isLoading, setIsLoading] = useState(false);
  // State untuk mengelola fokus input
  const [focusedInputs, setFocusedInputs] = useState<{
    [key: string]: boolean;
  }>({});

  // Fungsi untuk handle navigasi dengan loading
  const handleNavigateDay = (fn: () => void) => {
    setIsLoading(true);
    setTimeout(() => {
      fn();
      setIsLoading(false);
    }, 600); // durasi loading 600ms
  };
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});
  // State untuk navigasi hari
  const [currentDayIdx, setCurrentDayIdx] = useState(0);

  // Filter schedule berdasarkan search box
  const filteredSchedule = searchDate
    ? schedule.filter((row) => row.day.toString().includes(searchDate.trim()))
    : schedule;

  // Group data berdasarkan hari
  const groupedRows: { day: number; rows: typeof filteredSchedule }[] = [];
  filteredSchedule.forEach((row) => {
    const lastGroup = groupedRows[groupedRows.length - 1];
    if (lastGroup && lastGroup.day === row.day) {
      lastGroup.rows.push(row);
    } else {
      groupedRows.push({ day: row.day, rows: [row] });
    }
  });

  // Filter groupedRows berdasarkan hari valid dalam bulan dan bukan hari Minggu
  const maxDaysInMonth = getMaxDaysInMonth(scheduleName || "Juli 2025");
  const { month, year } = parseScheduleName(scheduleName || "Juli 2025");
  const validGroupedRows = groupedRows.filter((group) => {
    const isValidDay = group.day >= 1 && group.day <= maxDaysInMonth;
    const dayName = getDayName(group.day, month, year);
    return isValidDay && dayName !== "Minggu";
  });

  // Navigasi hari
  const totalDays = validGroupedRows.length;
  const totalValidDays = validGroupedRows.length;
  const currentDayData = validGroupedRows[currentDayIdx]
    ? [validGroupedRows[currentDayIdx]]
    : [];

  // Reset ke hari pertama saat search berubah
  useEffect(() => {
    setCurrentDayIdx(0);
  }, [searchDate, filteredSchedule.length]);

  // Clean up invalid manpower IDs when manpowerList changes
  useEffect(() => {
    const validManpowerIds = manpowerList.map((mp) => mp.id);

    // Clean up schedule data
    schedule.forEach((row) => {
      if (row.manpowerIds && Array.isArray(row.manpowerIds)) {
        const validIds = row.manpowerIds.filter((id) =>
          validManpowerIds.includes(id),
        );
        if (validIds.length !== row.manpowerIds.length) {
          row.manpowerIds = validIds;
        }
      }
    });

    // Clean up filteredSchedule data
    filteredSchedule.forEach((row) => {
      if (row.manpowerIds && Array.isArray(row.manpowerIds)) {
        const validIds = row.manpowerIds.filter((id) =>
          validManpowerIds.includes(id),
        );
        if (validIds.length !== row.manpowerIds.length) {
          row.manpowerIds = validIds;
        }
      }
    });

    // Clean up validGroupedRows data
    validGroupedRows.forEach((group) => {
      group.rows.forEach((row) => {
        if (row.manpowerIds && Array.isArray(row.manpowerIds)) {
          const validIds = row.manpowerIds.filter((id) =>
            validManpowerIds.includes(id),
          );
          if (validIds.length !== row.manpowerIds.length) {
            row.manpowerIds = validIds;
          }
        }
      });
    });
  }, [manpowerList, schedule, filteredSchedule, validGroupedRows]);

  const goToNextDay = () => {
    if (currentDayIdx < totalValidDays - 1) {
      setCurrentDayIdx(currentDayIdx + 1);
    }
  };

  const goToPreviousDay = () => {
    if (currentDayIdx > 0) {
      setCurrentDayIdx(currentDayIdx - 1);
    }
  };

  const goToDay = (dayIdx: number) => {
    if (dayIdx >= 0 && dayIdx < totalValidDays) {
      setCurrentDayIdx(dayIdx);
    }
  };

  const flatRows: ScheduleItem[] = validGroupedRows.flatMap((g) => g.rows);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // State untuk popup dan list manpower
  const [showManpowerModal, setShowManpowerModal] = useState(false);
  // State untuk notifikasi error manpower
  const [manpowerError, setManpowerError] = useState<string>("");
  // Ref for measuring the longest manpower name
  const manpowerListRef = useRef<HTMLUListElement>(null);
  const [modalMinWidth, setModalMinWidth] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    if (showManpowerModal && manpowerListRef.current) {
      // Find the longest name
      let maxWidth = 0;
      const items = manpowerListRef.current.querySelectorAll("li span");
      items.forEach((span) => {
        // Create a temporary span to measure width
        const temp = document.createElement("span");
        temp.style.visibility = "hidden";
        temp.style.position = "absolute";
        temp.style.fontWeight = "500";
        temp.style.fontSize = "16px";
        temp.style.fontFamily = "inherit";
        temp.innerText = span.textContent || "";
        document.body.appendChild(temp);
        maxWidth = Math.max(maxWidth, temp.offsetWidth);
        document.body.removeChild(temp);
      });
      // Add some padding
      if (maxWidth > 0) setModalMinWidth(`${maxWidth + 80}px`);
      else setModalMinWidth(undefined);
    }
  }, [showManpowerModal, manpowerList]);

  // Tambahkan state untuk temporary manpower selection
  const [tempManpowerSelection, setTempManpowerSelection] = useState<{
    [key: string]: number[];
  }>({});

  return (
    <div className="w-full p-3 sm:p-6">
      <div className="space-y-6 sm:space-y-8">
        {/* HEADER SUMMARY TOTAL */}
        <div className="w-full mb-4">
          <div
            className={`flex flex-col sm:flex-row gap-4 items-center justify-between ${uiColors.bg.secondary} rounded-xl p-4 border border-slate-600 shadow`}
          >
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-4 items-center w-full sm:w-auto mb-4 sm:mb-0">
              {/* Card summary untuk setiap total utama */}
              <SummaryCard
                icon={<Package className="w-5 h-5 text-blue-400" />}
                label="Stock Awal"
                value={initialStock}
              />
              <SummaryCard
                icon={<Truck className="w-5 h-5 text-cyan-400" />}
                label="Delivery"
                value={flatRows.reduce((sum, r) => sum + (r.delivery || 0), 0)}
              />
              <SummaryCard
                icon={<Target className="w-5 h-5 text-yellow-400" />}
                label="Planning"
                value={flatRows.reduce(
                  (sum, r) => sum + (r.planningPcs || 0),
                  0,
                )}
              />
              <SummaryCard
                icon={<Zap className="w-5 h-5 text-orange-400" />}
                label="Overtime"
                value={flatRows.reduce(
                  (sum, r) => sum + (r.overtimePcs || 0),
                  0,
                )}
              />
              <SummaryCard
                icon={<Factory className="w-5 h-5 text-purple-400" />}
                label="Hasil Produksi"
                value={flatRows.reduce((sum, r) => sum + (r.pcs || 0), 0)}
              />
              <SummaryCard
                icon={<Activity className="w-5 h-5 text-blue-400" />}
                label="Total Manpower"
                value={(() => {
                  return validGroupedRows.reduce((total, group) => {
                    const shift1 = group.rows.find((r) => r.shift === "1");
                    const shift2 = group.rows.find((r) => r.shift === "2");

                    const shift1Manpower = shift1?.manpowerIds?.length || 3; // default 3
                    const shift2Manpower = shift2?.manpowerIds?.length || 3; // default 3

                    return total + shift1Manpower + shift2Manpower;
                  }, 0);
                })()}
              />
            </div>
            <button
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition text-sm sm:text-base w-full sm:w-auto justify-center"
              onClick={() => setShowManpowerModal(true)}
              title="Tambah Manpower"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Add Manpower</span>
              <span className="sm:hidden">Add Manpower</span>
            </button>
          </div>
        </div>
        {/* Ganti notifikasi error manpower dengan pop up modal kecil di tengah layar */}
        {manpowerError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl min-w-[260px] max-w-xs relative animate-fade-in-out">
              <button
                className="absolute top-2 right-2 text-white/80 hover:text-white text-lg font-bold"
                onClick={() => setManpowerError("")}
                aria-label="Tutup"
              >
                ×
              </button>
              <div className="font-semibold text-base text-center">
                {manpowerError}
              </div>
            </div>
          </div>
        )}
        {/* MODAL MANPOWER */}
        {showManpowerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div
              className={`${uiColors.bg.tertiary} rounded-xl p-6 w-full max-w-md border border-slate-600 shadow-2xl relative`}
              style={modalMinWidth ? { minWidth: modalMinWidth } : {}}
            >
              <button
                className={`absolute top-2 right-2 ${uiColors.text.tertiary} hover:${uiColors.text.primary}`}
                onClick={() => setShowManpowerModal(false)}
              >
                <XCircle className="w-6 h-6" />
              </button>
              <h3
                className={`text-lg font-bold ${uiColors.text.primary} mb-4 flex items-center gap-2`}
              >
                <Activity className="w-5 h-5 text-green-400" />
                Daftar Manpower
              </h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newManpower}
                  onChange={(e) => setNewManpower(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-lg ${uiColors.bg.secondary} ${uiColors.border.secondary} ${uiColors.text.primary} focus:outline-none`}
                  placeholder="Nama manpower baru"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddManpower();
                  }}
                />
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center"
                  onClick={handleAddManpower}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <ul
                className="space-y-2 max-h-48 overflow-y-auto"
                ref={manpowerListRef}
              >
                {manpowerList.length === 0 && (
                  <li className={`${uiColors.text.tertiary} text-sm`}>
                    Belum ada manpower.
                  </li>
                )}
                {manpowerList.map((mp) => (
                  <li
                    key={mp.id}
                    className={`flex items-center justify-between ${uiColors.bg.secondary} rounded-lg px-3 py-2`}
                  >
                    <span className={`${uiColors.text.primary} font-medium`}>
                      {mp.id}. {mp.name}
                    </span>
                    <button
                      onClick={() => handleRemoveManpower(mp.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {/* Tampilkan hanya data untuk hari saat ini */}
        {currentDayData.map((group, groupIdx) => {
          // Hitung flatIdx berdasarkan posisi sebenarnya dalam groupedRows
          let flatIdx = groupedRows
            .slice(0, currentDayIdx)
            .reduce((sum, g) => sum + g.rows.length, 0);

          return (
            <div key={group.day} className="space-y-4 sm:space-y-6">
              {/* Enhanced Day Header */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pb-4 border-b border-slate-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg">
                    {group.day}
                  </div>
                  <div>
                    {(() => {
                      const dateInfo = formatValidDate(
                        group.day,
                        scheduleName || "Invalid Date",
                      );
                      return (
                        <>
                          <h3
                            className={`text-xl sm:text-2xl font-bold transition-colors ${
                              dateInfo.isValid
                                ? uiColors.text.primary
                                : "text-amber-400"
                            }`}
                          >
                            {dateInfo.formattedDate}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <p
                              className={`${uiColors.text.tertiary} text-sm sm:text-base`}
                            >
                              {dateInfo.dayName} • {group.rows.length} shift
                              produksi
                            </p>
                            {!dateInfo.isValid && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full border border-amber-500/30 w-fit">
                                <AlertTriangle className="w-3 h-3" />
                                <span className="hidden sm:inline">
                                  Tanggal disesuaikan
                                </span>
                                <span className="sm:hidden">Disesuaikan</span>
                              </span>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Navigation Info */}
                <div
                  className={`flex items-center gap-2 text-sm ${uiColors.text.tertiary}`}
                >
                  <span
                    className={`px-2 sm:px-3 py-1 ${uiColors.bg.tertiary} rounded-full border border-slate-600 text-xs sm:text-sm`}
                  >
                    Hari {currentDayIdx + 1} dari {totalValidDays}
                  </span>
                </div>
              </div>

              {/* Shifts Grid */}
              {(() => {
                const dayName = getDayName(group.day, month, year);
                if (dayName === "Minggu") {
                  return (
                    <div className="flex items-center justify-center py-8 sm:py-12">
                      <div className="text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                          <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-red-400 mb-2">
                          Hari Libur
                        </h3>
                        <p
                          className={`${uiColors.text.tertiary} text-sm sm:text-base`}
                        >
                          Tidak ada produksi pada hari ini
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                    {group.rows.map((row, rowIdx) => {
                      // --- Custom Output Calculation with Manpower ---
                      // Default: 3 manpower = 14 pcs/jam (14/3 = 4.666 pcs per manpower)
                      const defaultManpowerCount = 3;
                      const pcsPerManpower = 14 / 3; // 4.666 pcs per manpower
                      const manpowerCount =
                        row.manpowerIds?.length || defaultManpowerCount;
                      const effectiveTimePerPcs =
                        3600 / (manpowerCount * pcsPerManpower);

                      const calculated = calculateOutputFields(
                        row,
                        flatIdx,
                        flatRows,
                        effectiveTimePerPcs,
                        initialStock,
                      );
                      const validationAlerts = checkValidation(
                        row,
                        calculated,
                        timePerPcs,
                      );

                      // Output 1 jam with manpower consideration
                      const outputPerHour = manpowerCount * pcsPerManpower;
                      // Akumulasi Delivery Shift 1 & 2 using utils
                      const akumulasiDelivery = calculateAkumulasiDelivery(
                        group.day,
                        validGroupedRows,
                        currentDayIdx,
                      );

                      if (row.shift === "1") {
                        row.akumulasiDelivery = akumulasiDelivery.shift1;
                      } else if (row.shift === "2") {
                        row.akumulasiDelivery = akumulasiDelivery.shift2;
                      }

                      const akumulasiDeliveryShift1 =
                        row.shift === "1" ? akumulasiDelivery.shift1 : 0;
                      const akumulasiDeliveryShift2 =
                        row.shift === "2" ? akumulasiDelivery.shift2 : 0;

                      // Deklarasi prevDayGroup untuk digunakan di bagian lain
                      const prevDayGroup = groupedRows[currentDayIdx - 1];
                      // Planning Produksi (jam) - ceil, 1 digit
                      const planningJam = formatJamProduksi(
                        row.planningPcs || 0,
                        outputPerHour,
                      );
                      // Overtime (jam) - ceil, 1 digit
                      const overtimeJam = formatJamProduksi(
                        row.overtimePcs || 0,
                        outputPerHour,
                      );
                      // Jam Produksi (Cycle Time) - ceil, 1 digit
                      const hasilProduksi = row.pcs || 0;
                      const jamProduksi = formatJamProduksi(
                        hasilProduksi,
                        outputPerHour,
                      );
                      // Akumulasi Hasil Produksi Aktual using utils
                      const akumulasiHasil = calculateAkumulasiHasilProduksi(
                        group.day,
                        validGroupedRows,
                        currentDayIdx,
                      );

                      if (row.shift === "1") {
                        row.akumulasiHasilProduksi = akumulasiHasil.shift1;
                      } else if (row.shift === "2") {
                        row.akumulasiHasilProduksi = akumulasiHasil.shift2;
                      }

                      const akumulasiHasilProduksi =
                        row.shift === "1"
                          ? akumulasiHasil.shift1
                          : akumulasiHasil.shift2;
                      // --- Actual Stock & Rencana Stock Custom using utils ---
                      const stockCustom = calculateStockCustom(
                        row,
                        group,
                        validGroupedRows,
                        currentDayIdx,
                        initialStock,
                      );

                      // Simpan ke row agar bisa dipakai shift berikutnya
                      row.actualStockCustom = stockCustom.actualStock;
                      row.rencanaStockCustom = stockCustom.rencanaStock;

                      const actualStockCustom = stockCustom.actualStock;
                      const rencanaStockCustom = stockCustom.rencanaStock;

                      flatIdx++;

                      return (
                        <div
                          key={row.id}
                          className={`${uiColors.bg.secondary} rounded-2xl border-2 border-slate-600 transition-all duration-300 hover:shadow-2xl hover:border-slate-500`}
                        >
                          {/* Card Header */}
                          <div className="p-4 sm:p-6 border-b border-slate-600">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base">
                                  {row.shift}
                                </div>
                                <div>
                                  <h4
                                    className={`text-lg sm:text-xl font-bold ${uiColors.text.primary}`}
                                  >
                                    Shift {row.shift}
                                  </h4>
                                  <p
                                    className={`${uiColors.text.secondary} text-xs sm:text-sm`}
                                  >
                                    {row.shift === "1"
                                      ? "07:30-16:30"
                                      : "19:30-04:30"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3">
                                <StatusBadge status={row.status} />
                              </div>
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {/* Tampilkan nilai input meski tidak sedang edit */}
                            <div className="space-y-2 mt-2">
                              <div
                                className={`text-blue-600 font-bold text-xs mb-1 pl-1`}
                              >
                                Input Parameter
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                                <div className="bg-blue-900/80 rounded-2xl p-2 sm:p-3 border border-blue-400 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-blue-400/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <Calendar className="w-4 h-4 text-blue-300" />
                                    <span className="text-blue-200/90 font-semibold text-xs">
                                      Planning Produksi (pcs)
                                    </span>
                                  </div>
                                  <input
                                    type="number"
                                    step={1}
                                    value={
                                      focusedInputs[`${row.id}-planningPcs`]
                                        ? row.planningPcs || ""
                                        : row.planningPcs || 0
                                    }
                                    onChange={(e) => {
                                      row.planningPcs =
                                        Number(e.target.value) || 0;
                                      setEditForm((prev) => ({
                                        ...prev,
                                        planningPcs: row.planningPcs,
                                      }));
                                    }}
                                    onFocus={() => {
                                      setFocusedInputs((prev) => ({
                                        ...prev,
                                        [`${row.id}-planningPcs`]: true,
                                      }));
                                    }}
                                    onBlur={() => {
                                      setFocusedInputs((prev) => ({
                                        ...prev,
                                        [`${row.id}-planningPcs`]: false,
                                      }));
                                    }}
                                    className="mt-0.5 font-bold text-blue-100 text-base sm:text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                    placeholder=""
                                  />
                                </div>
                                <div className="bg-blue-900/80 rounded-2xl p-2 sm:p-3 border border-blue-400 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-blue-400/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <Truck className="w-4 h-4 text-blue-300" />
                                    <span className="text-blue-200/90 font-semibold text-xs">
                                      Delivery Plan (pcs)
                                    </span>
                                  </div>
                                  <input
                                    type="number"
                                    step={1}
                                    value={
                                      focusedInputs[`${row.id}-delivery`]
                                        ? row.delivery || ""
                                        : row.delivery || 0
                                    }
                                    onChange={(e) => {
                                      row.delivery =
                                        Number(e.target.value) || 0;
                                      setEditForm((prev) => ({
                                        ...prev,
                                        delivery: row.delivery,
                                      }));
                                    }}
                                    onFocus={() => {
                                      setFocusedInputs((prev) => ({
                                        ...prev,
                                        [`${row.id}-delivery`]: true,
                                      }));
                                    }}
                                    onBlur={() => {
                                      setFocusedInputs((prev) => ({
                                        ...prev,
                                        [`${row.id}-delivery`]: false,
                                      }));
                                    }}
                                    className="mt-0.5 font-bold text-blue-100 text-base sm:text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                    placeholder=""
                                  />
                                </div>
                                <div className="bg-blue-900/80 rounded-2xl p-2 sm:p-3 border border-blue-400 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-blue-400/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <Timer className="w-4 h-4 text-blue-300" />
                                    <span className="text-blue-200/90 font-semibold text-xs">
                                      Overtime (pcs)
                                    </span>
                                  </div>
                                  <input
                                    type="number"
                                    step={1}
                                    value={
                                      focusedInputs[`${row.id}-overtimePcs`]
                                        ? row.overtimePcs || ""
                                        : row.overtimePcs || 0
                                    }
                                    onChange={(e) => {
                                      row.overtimePcs =
                                        Number(e.target.value) || 0;
                                      setEditForm((prev) => ({
                                        ...prev,
                                        overtimePcs: row.overtimePcs,
                                      }));
                                    }}
                                    onFocus={() => {
                                      setFocusedInputs((prev) => ({
                                        ...prev,
                                        [`${row.id}-overtimePcs`]: true,
                                      }));
                                    }}
                                    onBlur={() => {
                                      setFocusedInputs((prev) => ({
                                        ...prev,
                                        [`${row.id}-overtimePcs`]: false,
                                      }));
                                    }}
                                    className="mt-0.5 font-bold text-blue-100 text-base sm:text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                    placeholder=""
                                  />
                                </div>
                                <div className="bg-blue-900/80 rounded-2xl p-2 sm:p-3 border border-blue-400 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-blue-400/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <Factory className="w-4 h-4 text-blue-300" />
                                    <span className="text-blue-200/90 font-semibold text-xs">
                                      Hasil Produksi Aktual (pcs)
                                    </span>
                                  </div>
                                  <input
                                    type="number"
                                    step={1}
                                    value={
                                      focusedInputs[`${row.id}-pcs`]
                                        ? row.pcs || ""
                                        : row.pcs || 0
                                    }
                                    onChange={(e) => {
                                      row.pcs = Number(e.target.value) || 0;
                                      setEditForm((prev) => ({
                                        ...prev,
                                        pcs: row.pcs,
                                      }));
                                    }}
                                    onFocus={() => {
                                      setFocusedInputs((prev) => ({
                                        ...prev,
                                        [`${row.id}-pcs`]: true,
                                      }));
                                    }}
                                    onBlur={() => {
                                      setFocusedInputs((prev) => ({
                                        ...prev,
                                        [`${row.id}-pcs`]: false,
                                      }));
                                    }}
                                    className="mt-0.5 font-bold text-blue-100 text-base sm:text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                    placeholder=""
                                  />
                                </div>
                                <div className="bg-blue-900/80 rounded-2xl p-2 sm:p-3 border border-blue-400 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-blue-400/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <Clock className="w-4 h-4 text-blue-300" />
                                    <span className="text-blue-200/90 font-semibold text-xs">
                                      Jam Produksi Aktual
                                    </span>
                                  </div>
                                  <input
                                    type="number"
                                    step={0.1}
                                    value={
                                      focusedInputs[
                                        `${row.id}-jamProduksiAktual`
                                      ]
                                        ? row.jamProduksiAktual || ""
                                        : row.jamProduksiAktual || 0
                                    }
                                    onChange={(e) => {
                                      row.jamProduksiAktual =
                                        Number(e.target.value) || 0;
                                      setEditForm((prev) => ({
                                        ...prev,
                                        jamProduksiAktual:
                                          row.jamProduksiAktual,
                                      }));
                                    }}
                                    onFocus={() => {
                                      setFocusedInputs((prev) => ({
                                        ...prev,
                                        [`${row.id}-jamProduksiAktual`]: true,
                                      }));
                                    }}
                                    onBlur={() => {
                                      setFocusedInputs((prev) => ({
                                        ...prev,
                                        [`${row.id}-jamProduksiAktual`]: false,
                                      }));
                                    }}
                                    className="mt-0.5 font-bold text-blue-100 text-base sm:text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                    placeholder="0"
                                  />
                                </div>
                                {/* Manpower (Multi-Select Dropdown) */}
                                <div className="bg-blue-900/80 rounded-2xl p-2 sm:p-3 border border-blue-400 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-blue-400/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <Activity className="w-4 h-4 text-blue-300" />
                                    <span className="text-blue-200/90 font-semibold text-xs">
                                      Manpower (max 6)
                                    </span>
                                  </div>
                                  {/* Custom Multi-Select Dropdown */}
                                  <div className="relative w-full">
                                    <button
                                      type="button"
                                      className="w-full mt-0.5 font-bold text-blue-100 text-base sm:text-lg bg-transparent border-none text-center focus:outline-none flex items-center justify-center gap-2 px-2 py-1 rounded-lg border border-blue-400"
                                      onClick={() => {
                                        if (manpowerList.length === 0) {
                                          setManpowerError(
                                            "Silakan tambahkan manpower terlebih dahulu",
                                          );
                                          setTimeout(() => {
                                            setManpowerError("");
                                          }, 3000);
                                          return;
                                        }
                                        setFocusedInputs((prev) => ({
                                          ...prev,
                                          [`${row.id}-manpowerDropdown`]:
                                            !prev[`${row.id}-manpowerDropdown`],
                                        }));
                                      }}
                                    >
                                      {row.manpowerIds &&
                                      row.manpowerIds.length > 0
                                        ? row.manpowerIds.length.toString()
                                        : "3"}
                                      <span className="ml-2">▼</span>
                                    </button>
                                    {/* Dropdown List */}
                                    {focusedInputs[
                                      `${row.id}-manpowerDropdown`
                                    ] && (
                                      <div
                                        className={`absolute z-20 left-0 right-0 ${uiColors.bg.primary} border border-blue-400 rounded-lg mt-1 shadow-xl`}
                                      >
                                        {/* Header */}
                                        <div
                                          className={`${uiColors.bg.tertiary} px-3 py-2 border-b border-blue-400`}
                                        >
                                          <h4
                                            className={`${uiColors.text.primary} font-semibold text-sm`}
                                          >
                                            Pilih Manpower
                                          </h4>
                                        </div>

                                        {/* Manpower List */}
                                        <div className="p-2">
                                          {manpowerList.length === 0 ? (
                                            <div className="text-center py-4">
                                              <div
                                                className={`${uiColors.text.tertiary} text-sm`}
                                              >
                                                Belum ada manpower
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="space-y-1">
                                              {manpowerList.map((mp) => (
                                                <label
                                                  key={mp.id}
                                                  className={`flex items-center px-2 py-2 hover:bg-blue-100 cursor-pointer rounded transition-colors duration-200`}
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={(
                                                      tempManpowerSelection[
                                                        row.id
                                                      ] ||
                                                      row.manpowerIds || [
                                                        1, 2, 3,
                                                      ]
                                                    ).includes(mp.id)}
                                                    disabled={
                                                      (
                                                        tempManpowerSelection[
                                                          row.id
                                                        ] ||
                                                        row.manpowerIds || [
                                                          1, 2, 3,
                                                        ]
                                                      ).length >= 6 &&
                                                      !(
                                                        tempManpowerSelection[
                                                          row.id
                                                        ] ||
                                                        row.manpowerIds || [
                                                          1, 2, 3,
                                                        ]
                                                      ).includes(mp.id)
                                                    }
                                                    onChange={(e) => {
                                                      let newIds =
                                                        tempManpowerSelection[
                                                          row.id
                                                        ] ||
                                                          row.manpowerIds || [
                                                            1, 2, 3,
                                                          ];
                                                      if (e.target.checked) {
                                                        if (newIds.length < 6) {
                                                          newIds = [
                                                            ...newIds,
                                                            mp.id,
                                                          ];
                                                        }
                                                      } else {
                                                        newIds = newIds.filter(
                                                          (id) => id !== mp.id,
                                                        );
                                                      }
                                                      setTempManpowerSelection(
                                                        (prev) => ({
                                                          ...prev,
                                                          [row.id]: newIds,
                                                        }),
                                                      );
                                                    }}
                                                    className={`mr-2 w-4 h-4 text-blue-600 ${uiColors.bg.tertiary} ${uiColors.border.primary} rounded focus:ring-blue-500 focus:ring-2`}
                                                  />
                                                  <span className="text-blue-800 text-sm">
                                                    {mp.id}. {mp.name}
                                                  </span>
                                                </label>
                                              ))}
                                            </div>
                                          )}
                                        </div>

                                        {/* Footer dengan Button */}
                                        <div
                                          className={`${uiColors.bg.tertiary} px-3 py-2 border-t border-blue-400`}
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <div
                                              className={`${uiColors.text.tertiary} text-xs`}
                                            >
                                              {
                                                (
                                                  tempManpowerSelection[
                                                    row.id
                                                  ] ||
                                                  row.manpowerIds || [1, 2, 3]
                                                ).length
                                              }{" "}
                                              terpilih
                                            </div>
                                            <div
                                              className={`${uiColors.text.tertiary} text-xs`}
                                            >
                                              Max: 6
                                            </div>
                                          </div>
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => {
                                                setFocusedInputs((prev) => ({
                                                  ...prev,
                                                  [`${row.id}-manpowerDropdown`]:
                                                    false,
                                                }));
                                                // Reset temporary selection
                                                setTempManpowerSelection(
                                                  (prev) => ({
                                                    ...prev,
                                                    [row.id]: undefined,
                                                  }),
                                                );
                                              }}
                                              className={`flex-1 ${uiColors.bg.secondary} hover:${uiColors.bg.tertiary} text-red-500 py-1 px-3 rounded text-xs font-medium transition-colors`}
                                            >
                                              Batal
                                            </button>
                                            <button
                                              onClick={() => {
                                                const selectedIds =
                                                  tempManpowerSelection[
                                                    row.id
                                                  ] ||
                                                    row.manpowerIds || [
                                                      1, 2, 3,
                                                    ];
                                                row.manpowerIds = selectedIds;
                                                setEditForm((prev) => ({
                                                  ...prev,
                                                  manpowerIds: selectedIds,
                                                }));
                                                setFocusedInputs((prev) => ({
                                                  ...prev,
                                                  [`${row.id}-manpowerDropdown`]:
                                                    false,
                                                }));
                                              }}
                                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-xs font-semibold transition-colors"
                                            >
                                              OK
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  {/* Badge/Chip ID Manpower Terpilih */}
                                  {/* (Bagian ini dihapus sesuai permintaan) */}
                                  {/* Error jika lebih dari 6 */}
                                  {row.manpowerIds &&
                                    row.manpowerIds.length > 6 && (
                                      <div className="text-red-500 text-xs mt-1">
                                        Maksimal 6 manpower per shift.
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                            {/* Output Section: Custom Output sesuai rumus user */}
                            <div className="space-y-2 mt-2">
                              <div
                                className={`text-blue-600 font-bold text-xs mb-1 pl-1`}
                              >
                                Output Parameter
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                                {/* Akumulasi Delivery hanya tampil di shift yang sesuai */}
                                {row.shift === "1" && (
                                  <div
                                    className={`${theme === "light" ? "bg-white border-gray-300" : "bg-slate-800/90 border-slate-600"} rounded-2xl p-2 sm:p-3 border flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg ${theme === "light" ? "shadow-gray-300/40" : "shadow-slate-600/40"} w-full`}
                                  >
                                    <div className="flex items-center gap-1 mb-0.5 w-full">
                                      <Truck
                                        className={`w-4 h-4 ${theme === "light" ? "text-gray-600" : "text-slate-300"}`}
                                      />
                                      <span
                                        className={`font-semibold text-xs ${theme === "light" ? "text-gray-700" : "text-slate-300/90"}`}
                                      >
                                        Akumulasi Delivery Shift 1
                                      </span>
                                    </div>
                                    <span
                                      className={`font-bold text-base sm:text-lg mt-0.5 ${theme === "light" ? "text-gray-900" : "text-slate-200"}`}
                                    >
                                      {akumulasiDeliveryShift1}
                                    </span>
                                  </div>
                                )}
                                {row.shift === "2" && (
                                  <div
                                    className={`${theme === "light" ? "bg-white border-gray-300" : "bg-slate-800/90 border-slate-600"} rounded-2xl p-2 sm:p-3 border flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg ${theme === "light" ? "shadow-gray-300/40" : "shadow-slate-600/40"} w-full`}
                                  >
                                    <div className="flex items-center gap-1 mb-0.5 w-full">
                                      <Truck
                                        className={`w-4 h-4 ${theme === "light" ? "text-gray-600" : "text-slate-300"}`}
                                      />
                                      <span
                                        className={`font-semibold text-xs ${theme === "light" ? "text-gray-700" : "text-slate-300/90"}`}
                                      >
                                        Akumulasi Delivery Shift 2
                                      </span>
                                    </div>
                                    <span
                                      className={`font-bold text-base sm:text-lg mt-0.5 ${theme === "light" ? "text-gray-900" : "text-slate-200"}`}
                                    >
                                      {akumulasiDeliveryShift2}
                                    </span>
                                  </div>
                                )}
                                <div
                                  className={`${theme === "light" ? "bg-white border-gray-300" : "bg-slate-800/90 border-slate-600"} rounded-2xl p-2 sm:p-3 border flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg ${theme === "light" ? "shadow-gray-300/40" : "shadow-slate-600/40"} w-full`}
                                >
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <Clock
                                      className={`w-4 h-4 ${theme === "light" ? "text-gray-600" : "text-slate-300"}`}
                                    />
                                    <span
                                      className={`font-semibold text-xs ${theme === "light" ? "text-gray-700" : "text-slate-300/90"}`}
                                    >
                                      Planning Produksi (jam)
                                    </span>
                                  </div>
                                  <span
                                    className={`font-bold text-base sm:text-lg mt-0.5 ${theme === "light" ? "text-gray-900" : "text-slate-200"}`}
                                  >
                                    {planningJam}
                                  </span>
                                </div>
                                <div
                                  className={`${theme === "light" ? "bg-white border-gray-300" : "bg-slate-800/90 border-slate-600"} rounded-2xl p-2 sm:p-3 border flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg ${theme === "light" ? "shadow-gray-300/40" : "shadow-slate-600/40"} w-full`}
                                >
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <Timer
                                      className={`w-4 h-4 ${theme === "light" ? "text-gray-600" : "text-slate-300"}`}
                                    />
                                    <span
                                      className={`font-semibold text-xs ${theme === "light" ? "text-gray-700" : "text-slate-300/90"}`}
                                    >
                                      Overtime (jam)
                                    </span>
                                  </div>
                                  <span
                                    className={`font-bold text-base sm:text-lg mt-0.5 ${theme === "light" ? "text-gray-900" : "text-slate-200"}`}
                                  >
                                    {overtimeJam}
                                  </span>
                                </div>
                                <div
                                  className={`${theme === "light" ? "bg-white border-gray-300" : "bg-slate-800/90 border-slate-600"} rounded-2xl p-2 sm:p-3 border flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg ${theme === "light" ? "shadow-gray-300/40" : "shadow-slate-600/40"} w-full`}
                                >
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <Clock
                                      className={`w-4 h-4 ${theme === "light" ? "text-gray-600" : "text-slate-300"}`}
                                    />
                                    <span
                                      className={`font-semibold text-xs ${theme === "light" ? "text-gray-700" : "text-slate-300/90"}`}
                                    >
                                      Jam Produksi (Cycle Time)
                                    </span>
                                  </div>
                                  <span
                                    className={`font-bold text-base sm:text-lg mt-0.5 ${theme === "light" ? "text-gray-900" : "text-slate-200"}`}
                                  >
                                    {jamProduksi}
                                  </span>
                                </div>
                                <div
                                  className={`${theme === "light" ? "bg-white border-gray-300" : "bg-slate-800/90 border-slate-600"} rounded-2xl p-2 sm:p-3 border flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg ${theme === "light" ? "shadow-gray-300/40" : "shadow-slate-600/40"} w-full`}
                                >
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <Factory
                                      className={`w-4 h-4 ${theme === "light" ? "text-gray-600" : "text-slate-300"}`}
                                    />
                                    <span
                                      className={`font-semibold text-xs ${theme === "light" ? "text-gray-700" : "text-slate-300/90"}`}
                                    >
                                      Akumulasi Hasil Produksi Aktual
                                    </span>
                                  </div>
                                  <span
                                    className={`font-bold text-base sm:text-lg mt-0.5 ${theme === "light" ? "text-gray-900" : "text-slate-200"}`}
                                  >
                                    {akumulasiHasilProduksi}
                                  </span>
                                </div>

                                <div
                                  className={`${theme === "light" ? "bg-white border-gray-300" : "bg-slate-800/90 border-slate-600"} rounded-2xl p-2 sm:p-3 border flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg ${theme === "light" ? "shadow-gray-300/40" : "shadow-slate-600/40"} w-full`}
                                >
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <Package
                                      className={`w-4 h-4 ${theme === "light" ? "text-gray-600" : "text-slate-300"}`}
                                    />
                                    <span
                                      className={`font-semibold text-xs ${theme === "light" ? "text-gray-700" : "text-slate-300/90"}`}
                                    >
                                      Actual Stock
                                    </span>
                                  </div>
                                  <span
                                    className={`font-bold text-base sm:text-lg mt-0.5 ${theme === "light" ? "text-gray-900" : "text-slate-200"}`}
                                  >
                                    {actualStockCustom}
                                  </span>
                                </div>
                                <div
                                  className={`${theme === "light" ? "bg-white border-gray-300" : "bg-slate-800/90 border-slate-600"} rounded-2xl p-2 sm:p-3 border flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg ${theme === "light" ? "shadow-gray-300/40" : "shadow-slate-600/40"} w-full`}
                                >
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <TrendingUp
                                      className={`w-4 h-4 ${theme === "light" ? "text-gray-600" : "text-slate-300"}`}
                                    />
                                    <span
                                      className={`font-semibold text-xs ${theme === "light" ? "text-gray-700" : "text-slate-300/90"}`}
                                    >
                                      Rencana Stock
                                    </span>
                                  </div>
                                  <span
                                    className={`font-bold text-base sm:text-lg mt-0.5 ${theme === "light" ? "text-gray-900" : "text-slate-200"}`}
                                  >
                                    {rencanaStockCustom}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          );
        })}

        {/* Navigation Controls */}
        <div className="mt-6 sm:mt-8 flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
          {(() => {
            // Navigation only for valid (non-Sunday) days
            if (validGroupedRows.length === 0) return null;
            const totalDays = validGroupedRows.length;
            const currentIdx = currentDayIdx;
            const showAroundCurrent = 1;
            const startIndex = Math.max(0, currentIdx - showAroundCurrent);
            const endIndex = Math.min(
              totalDays - 1,
              currentIdx + showAroundCurrent,
            );

            // Prev/Next logic
            const isPrevDisabled = currentIdx === 0;
            const isNextDisabled = currentIdx === totalDays - 1;
            const prevButton = (
              <button
                key="prev"
                onClick={() => handleNavigateDay(() => goToDay(currentIdx - 1))}
                disabled={isPrevDisabled}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border font-bold text-base flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${
                  isPrevDisabled
                    ? `${uiColors.bg.tertiary}/50 ${uiColors.text.muted} border-slate-600 cursor-not-allowed`
                    : `${uiColors.bg.tertiary} ${uiColors.text.tertiary} border-slate-600 hover:${uiColors.bg.secondary} hover:${uiColors.text.primary} hover:border-slate-500`
                }`}
                title="Sebelumnya"
              >
                {"<"}
              </button>
            );
            const nextButton = (
              <button
                key="next"
                onClick={() => handleNavigateDay(() => goToDay(currentIdx + 1))}
                disabled={isNextDisabled}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border font-bold text-base flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${
                  isNextDisabled
                    ? `${uiColors.bg.tertiary}/50 ${uiColors.text.muted} border-slate-600 cursor-not-allowed`
                    : `${uiColors.bg.tertiary} ${uiColors.text.tertiary} border-slate-600 hover:${uiColors.bg.secondary} hover:${uiColors.text.primary} hover:border-slate-500`
                }`}
                title="Berikutnya"
              >
                {">"}
              </button>
            );
            // Day buttons
            const dayButtons = [];
            // Always show first day (label 1)
            dayButtons.push(createDayButton(0));
            // Ellipsis if needed
            if (startIndex > 1) dayButtons.push(createEllipsis("ellipsis1"));
            // Days around current
            for (let i = startIndex; i <= endIndex; i++) {
              if (i !== 0 && i !== totalDays - 1) {
                dayButtons.push(createDayButton(i));
              }
            }
            // Ellipsis if needed
            if (endIndex < totalDays - 2)
              dayButtons.push(createEllipsis("ellipsis2"));
            // Always show last day (label totalDays)
            if (totalDays > 1) dayButtons.push(createDayButton(totalDays - 1));
            // Helper for day button
            function createDayButton(idx) {
              const isActive = currentIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleNavigateDay(() => goToDay(idx))}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border font-semibold text-xs sm:text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${
                    isActive
                      ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white border-blue-600 shadow-lg scale-110"
                      : `${uiColors.bg.tertiary} ${uiColors.text.tertiary} border-slate-600 hover:${uiColors.bg.secondary} hover:${uiColors.text.primary} hover:border-slate-500`
                  }`}
                  title={`Hari ke-${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            }
            // Helper for ellipsis
            function createEllipsis(key) {
              return (
                <span
                  key={key}
                  className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center ${uiColors.text.muted} font-bold text-xs sm:text-sm`}
                >
                  ...
                </span>
              );
            }
            return [prevButton, ...dayButtons, nextButton];
          })()}
        </div>
      </div>

      {/* Loading Popup */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`${uiColors.bg.tertiary} rounded-xl p-4 sm:p-6 border border-slate-600 shadow-2xl mx-4`}
          >
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              <span
                className={`${uiColors.text.primary} font-medium text-sm sm:text-base`}
              >
                Memuat data...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  const { uiColors } = useTheme();
  return (
    <div
      className={`flex flex-col items-center ${uiColors.bg.tertiary} rounded-lg px-1 sm:px-4 py-2 min-w-[70px] sm:min-w-[90px] border border-slate-600 shadow`}
    >
      <div className="w-3 h-3 sm:w-5 sm:h-5">{icon}</div>
      <div
        className={`text-[10px] sm:text-xs ${uiColors.text.tertiary} font-semibold mt-1 text-center leading-tight`}
      >
        {label}
      </div>
      <div
        className={`text-xs sm:text-lg font-bold ${uiColors.text.primary} mt-1`}
      >
        {value}
      </div>
    </div>
  );
}

export default ScheduleCardsView;
