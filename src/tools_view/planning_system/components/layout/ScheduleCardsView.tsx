import React, { useState, useEffect } from "react";
import { ScheduleItem, ScheduleTableProps } from "../../types/scheduleTypes";
import {
  getDaysInMonth,
  getDayName,
  isWeekend,
  formatValidDate,
  MONTHS,
  getMaxDaysInMonth,
} from "../../utils/scheduleDateUtils";
import {
  calculateOutputFields,
  checkValidation,
  calculateOutputPerHour,
  formatJamProduksi,
  calculateAkumulasiDelivery,
  calculateAkumulasiHasilProduksi,
  calculateStockCustom,
} from "../../utils/scheduleCalcUtils";
import StatusBadge from "../ui/StatusBadge";
import DataCard from "../ui/DataCard";
import EditableField from "../ui/EditableField";
import {
  Calendar,
  Clock,
  Package,
  Truck,
  Timer,
  Factory,
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

interface ScheduleCardsViewProps {
  schedule: ScheduleItem[];
  setEditForm: React.Dispatch<React.SetStateAction<Partial<ScheduleItem>>>;
  initialStock: number;
  timePerPcs: number;
  scheduleName?: string;
  searchDate?: string;
}

const ScheduleCardsView: React.FC<ScheduleCardsViewProps> = ({
  schedule,
  setEditForm,
  initialStock,
  timePerPcs = 257,
  scheduleName,
  searchDate = "",
}) => {
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

  // Filter groupedRows berdasarkan hari valid dalam bulan
  const maxDaysInMonth = getMaxDaysInMonth(scheduleName || "Juli 2025");
  const validGroupedRows = groupedRows.filter(
    (group) => group.day >= 1 && group.day <= maxDaysInMonth,
  );

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

  return (
    <div className="w-full p-3 sm:p-6">
      <div className="space-y-6 sm:space-y-8">
        {/* Tampilkan hanya data untuk hari saat ini */}
        {currentDayData.map((group, groupIdx) => {
          // Hitung flatIdx berdasarkan posisi sebenarnya dalam groupedRows
          let flatIdx = groupedRows
            .slice(0, currentDayIdx)
            .reduce((sum, g) => sum + g.rows.length, 0);

          return (
            <div key={group.day} className="space-y-4 sm:space-y-6">
              {/* Enhanced Day Header */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pb-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg">
                    {group.day}
                  </div>
                  <div>
                    {(() => {
                      const dateInfo = formatValidDate(
                        group.day,
                        scheduleName || "Februari 2025",
                      );
                      return (
                        <>
                          <h3
                            className={`text-xl sm:text-2xl font-bold transition-colors ${
                              dateInfo.isValid ? "text-white" : "text-amber-400"
                            }`}
                          >
                            {dateInfo.formattedDate}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <p className="text-slate-400 text-sm sm:text-base">
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
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="px-2 sm:px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700 text-xs sm:text-sm">
                    Hari {currentDayIdx + 1} dari {totalValidDays}
                  </span>
                </div>
              </div>

              {/* Shifts Grid */}
              {(() => {
                const isWeekendDay = isWeekend(
                  group.day,
                  scheduleName || "Juli 2025",
                );

                if (isWeekendDay) {
                  return (
                    <div className="flex items-center justify-center py-8 sm:py-12">
                      <div className="text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                          <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-red-400 mb-2">
                          Hari Libur
                        </h3>
                        <p className="text-slate-400 text-sm sm:text-base">
                          Tidak ada produksi pada hari ini
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {group.rows.map((row, rowIdx) => {
                      // --- Custom Output Calculation ---
                      const calculated = calculateOutputFields(
                        row,
                        flatIdx,
                        flatRows,
                        timePerPcs,
                        initialStock,
                      );
                      const validationAlerts = checkValidation(
                        row,
                        calculated,
                        timePerPcs,
                      );

                      // Output 1 jam
                      const outputPerHour = calculateOutputPerHour(
                        timePerPcs,
                        [],
                      );
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
                      // Planning (jam) - ceil, 1 digit
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
                      // Akumulasi Hasil Produksi using utils
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
                      // --- Teori Stock & Rencana Stock Custom using utils ---
                      const stockCustom = calculateStockCustom(
                        row,
                        group,
                        validGroupedRows,
                        currentDayIdx,
                        initialStock,
                      );

                      // Simpan ke row agar bisa dipakai shift berikutnya
                      row.teoriStockCustom = stockCustom.teoriStock;
                      row.actualStockCustom = stockCustom.actualStock;
                      row.rencanaStockCustom = stockCustom.rencanaStock;

                      const teoriStockCustom = stockCustom.teoriStock;
                      const actualStockCustom = stockCustom.actualStock;
                      const rencanaStockCustom = stockCustom.rencanaStock;

                      flatIdx++;

                      return (
                        <div
                          key={row.id}
                          className={`bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-700/50 transition-all duration-300 hover:shadow-2xl hover:border-slate-600/50`}
                        >
                          {/* Card Header */}
                          <div className="p-4 sm:p-6 border-b border-slate-700/50">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base">
                                  {row.shift}
                                </div>
                                <div>
                                  <h4 className="text-lg sm:text-xl font-bold text-white">
                                    Shift {row.shift}
                                  </h4>
                                  <p className="text-slate-400 text-xs sm:text-sm">
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
                              <div className="text-blue-300 font-bold text-xs mb-1 pl-1">
                                Input Parameter
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                                <div className="bg-blue-900/80 rounded-2xl p-2 sm:p-3 border border-blue-400 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-blue-400/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <Calendar className="w-4 h-4 text-blue-300" />
                                    <span className="text-blue-200/90 font-semibold text-xs">
                                      Planning (pcs)
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
                                      Delivery (pcs)
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
                                      Hasil Produksi (pcs)
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
                                    placeholder=""
                                  />
                                </div>
                              </div>
                            </div>
                            {/* Output Section: Custom Output sesuai rumus user */}
                            <div className="space-y-2 mt-2">
                              <div className="text-blue-300 font-bold text-xs mb-1 pl-1">
                                Output Parameter
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                                {/* Akumulasi Delivery hanya tampil di shift yang sesuai */}
                                {row.shift === "1" && (
                                  <div className="bg-slate-800/90 rounded-2xl p-2 sm:p-3 border border-slate-600 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-slate-600/40 w-full">
                                    <div className="flex items-center gap-1 mb-0.5 w-full">
                                      <Truck className="w-4 h-4 text-slate-300" />
                                      <span className="font-semibold text-xs text-slate-300/90">
                                        Akumulasi Delivery Shift 1
                                      </span>
                                    </div>
                                    <span className="font-bold text-slate-200 text-base sm:text-lg mt-0.5">
                                      {akumulasiDeliveryShift1}
                                    </span>
                                  </div>
                                )}
                                {row.shift === "2" && (
                                  <div className="bg-slate-800/90 rounded-2xl p-2 sm:p-3 border border-slate-600 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-slate-600/40 w-full">
                                    <div className="flex items-center gap-1 mb-0.5 w-full">
                                      <Truck className="w-4 h-4 text-slate-300" />
                                      <span className="font-semibold text-xs text-slate-300/90">
                                        Akumulasi Delivery Shift 2
                                      </span>
                                    </div>
                                    <span className="font-bold text-slate-200 text-base sm:text-lg mt-0.5">
                                      {akumulasiDeliveryShift2}
                                    </span>
                                  </div>
                                )}
                                <div className="bg-slate-800/90 rounded-2xl p-2 sm:p-3 border border-slate-600 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-slate-600/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <Clock className="w-4 h-4 text-slate-300" />
                                    <span className="font-semibold text-xs text-slate-300/90">
                                      Planning (jam)
                                    </span>
                                  </div>
                                  <span className="font-bold text-slate-200 text-base sm:text-lg mt-0.5">
                                    {planningJam}
                                  </span>
                                </div>
                                <div className="bg-slate-800/90 rounded-2xl p-2 sm:p-3 border border-slate-600 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-slate-600/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <Timer className="w-4 h-4 text-slate-300" />
                                    <span className="font-semibold text-xs text-slate-300/90">
                                      Overtime (jam)
                                    </span>
                                  </div>
                                  <span className="font-bold text-slate-200 text-base sm:text-lg mt-0.5">
                                    {overtimeJam}
                                  </span>
                                </div>
                                <div className="bg-slate-800/90 rounded-2xl p-2 sm:p-3 border border-slate-600 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-slate-600/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <Clock className="w-4 h-4 text-slate-300" />
                                    <span className="font-semibold text-xs text-slate-300/90">
                                      Jam Produksi (Cycle Time)
                                    </span>
                                  </div>
                                  <span className="font-bold text-slate-200 text-base sm:text-lg mt-0.5">
                                    {jamProduksi}
                                  </span>
                                </div>
                                <div className="bg-slate-800/90 rounded-2xl p-2 sm:p-3 border border-slate-600 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-slate-600/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <Factory className="w-4 h-4 text-slate-300" />
                                    <span className="font-semibold text-xs text-slate-300/90">
                                      Akumulasi Hasil Produksi
                                    </span>
                                  </div>
                                  <span className="font-bold text-slate-200 text-base sm:text-lg mt-0.5">
                                    {akumulasiHasilProduksi}
                                  </span>
                                </div>
                                <div className="bg-slate-800/90 rounded-2xl p-2 sm:p-3 border border-slate-600 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-slate-600/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <Calculator className="w-4 h-4 text-slate-300" />
                                    <span className="font-semibold text-xs text-slate-300/90">
                                      Teori Stock
                                    </span>
                                  </div>
                                  <span className="font-bold text-slate-200 text-base sm:text-lg mt-0.5">
                                    {teoriStockCustom}
                                  </span>
                                </div>
                                <div className="bg-slate-800/90 rounded-2xl p-2 sm:p-3 border border-slate-600 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-slate-600/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <Package className="w-4 h-4 text-slate-300" />
                                    <span className="font-semibold text-xs text-slate-300/90">
                                      Actual Stock
                                    </span>
                                  </div>
                                  <span className="font-bold text-slate-200 text-base sm:text-lg mt-0.5">
                                    {actualStockCustom}
                                  </span>
                                </div>
                                <div className="bg-slate-800/90 rounded-2xl p-2 sm:p-3 border border-slate-600 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-slate-600/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <TrendingUp className="w-4 h-4 text-slate-300" />
                                    <span className="font-semibold text-xs text-slate-300/90">
                                      Rencana Stock
                                    </span>
                                  </div>
                                  <span className="font-bold text-slate-200 text-base sm:text-lg mt-0.5">
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
            // Selalu tampilkan semua hari dalam bulan dengan ellipsis
            const maxDays = maxDaysInMonth;
            const allDays = Array.from({ length: maxDays }, (_, i) => i + 1);
            const currentDay =
              validGroupedRows[currentDayIdx]?.day || allDays[0] || 1;
            // currentDayIndex selalu berdasarkan posisi hari dalam bulan (1-30), bukan dalam hasil pencarian
            const currentDayIndex = currentDay - 1; // Karena array dimulai dari 0, tapi hari dimulai dari 1

            // Fungsi untuk mendapatkan next/prev day berdasarkan urutan dalam hasil pencarian
            const getNextDayInSearch = () => {
              if (currentDayIdx < validGroupedRows.length - 1) {
                return currentDayIdx + 1;
              }
              return currentDayIdx; // Tetap di posisi sekarang jika tidak ada next
            };

            const getPrevDayInSearch = () => {
              if (currentDayIdx > 0) {
                return currentDayIdx - 1;
              }
              return currentDayIdx; // Tetap di posisi sekarang jika tidak ada prev
            };

            // Fungsi navigasi yang benar-benar berdasarkan urutan hari normal
            const getNextDay = () => {
              const nextDayInMonth = currentDay + 1;
              if (nextDayInMonth <= maxDays) {
                // Cari apakah next day ada di hasil pencarian
                const nextDayIdx = validGroupedRows.findIndex(
                  (g) => g.day === nextDayInMonth,
                );
                if (nextDayIdx !== -1) {
                  return nextDayIdx;
                } else {
                  // Jika next day tidak ada di hasil pencarian, cari hari berikutnya yang ada
                  for (let day = nextDayInMonth + 1; day <= maxDays; day++) {
                    const dayIdx = validGroupedRows.findIndex(
                      (g) => g.day === day,
                    );
                    if (dayIdx !== -1) {
                      return dayIdx;
                    }
                  }
                  // Jika tidak ada hari berikutnya dalam hasil pencarian, cari hari terdekat yang ada
                  const allDaysInSearch = validGroupedRows
                    .map((g) => g.day)
                    .sort((a, b) => a - b);
                  if (allDaysInSearch.length > 0) {
                    const lastDay = allDaysInSearch[allDaysInSearch.length - 1];
                    if (lastDay > currentDay) {
                      return validGroupedRows.findIndex(
                        (g) => g.day === lastDay,
                      );
                    }
                  }
                }
              }
              return currentDayIdx; // Tetap di posisi sekarang jika tidak ada next
            };

            const getPrevDay = () => {
              const prevDayInMonth = currentDay - 1;
              if (prevDayInMonth >= 1) {
                // Cari apakah prev day ada di hasil pencarian
                const prevDayIdx = validGroupedRows.findIndex(
                  (g) => g.day === prevDayInMonth,
                );
                if (prevDayIdx !== -1) {
                  return prevDayIdx;
                } else {
                  // Jika prev day tidak ada di hasil pencarian, cari hari sebelumnya yang ada
                  for (let day = prevDayInMonth - 1; day >= 1; day--) {
                    const dayIdx = validGroupedRows.findIndex(
                      (g) => g.day === day,
                    );
                    if (dayIdx !== -1) {
                      return dayIdx;
                    }
                  }
                  // Jika tidak ada hari sebelumnya dalam hasil pencarian, cari hari terdekat yang ada
                  const allDaysInSearch = validGroupedRows
                    .map((g) => g.day)
                    .sort((a, b) => a - b);
                  if (allDaysInSearch.length > 0) {
                    const firstDay = allDaysInSearch[0];
                    if (firstDay < currentDay) {
                      return validGroupedRows.findIndex(
                        (g) => g.day === firstDay,
                      );
                    }
                  }
                }
              }
              return currentDayIdx; // Tetap di posisi sekarang jika tidak ada prev
            };

            // Fungsi untuk menentukan apakah tombol harus disabled
            const isPrevDisabled = () => {
              // Disabled jika tidak ada prev day yang valid
              const prevDay = getPrevDay();
              return prevDay === currentDayIdx;
            };

            const isNextDisabled = () => {
              // Disabled jika tidak ada next day yang valid
              const nextDay = getNextDay();
              return nextDay === currentDayIdx;
            };

            // Tombol Prev
            const prevButton = (
              <button
                key="prev"
                onClick={() => handleNavigateDay(() => goToDay(getPrevDay()))}
                disabled={isPrevDisabled()}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border font-bold text-base flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${
                  isPrevDisabled()
                    ? "bg-slate-800/50 text-slate-500 border-slate-700 cursor-not-allowed"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white hover:border-slate-600"
                }`}
                title="Sebelumnya"
              >
                {"<"}
              </button>
            );

            // Tombol Next
            const nextButton = (
              <button
                key="next"
                onClick={() => handleNavigateDay(() => goToDay(getNextDay()))}
                disabled={isNextDisabled()}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border font-bold text-base flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${
                  isNextDisabled()
                    ? "bg-slate-800/50 text-slate-500 border-slate-700 cursor-not-allowed"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white hover:border-slate-600"
                }`}
                title="Berikutnya"
              >
                {">"}
              </button>
            );

            // Fungsi buat button hari
            const createDayButton = (day) => {
              const isActive = currentDay === day;
              const hasData = validGroupedRows.some((g) => g.day === day);

              return (
                <button
                  key={day}
                  onClick={() => {
                    // Cari index group yang day-nya sama
                    const idx = validGroupedRows.findIndex(
                      (g) => g.day === day,
                    );
                    if (idx !== -1) {
                      handleNavigateDay(() => goToDay(idx));
                    } else {
                      // Jika hari tidak ada dalam hasil pencarian, cari hari terdekat yang ada
                      const allDaysInSearch = validGroupedRows
                        .map((g) => g.day)
                        .sort((a, b) => a - b);
                      let targetIdx = 0;

                      // Cari hari terdekat yang lebih besar atau sama dengan target
                      for (let i = 0; i < allDaysInSearch.length; i++) {
                        if (allDaysInSearch[i] >= day) {
                          targetIdx = validGroupedRows.findIndex(
                            (g) => g.day === allDaysInSearch[i],
                          );
                          break;
                        }
                      }

                      // Jika tidak ada yang lebih besar, gunakan hari terakhir
                      if (targetIdx === 0 && allDaysInSearch.length > 0) {
                        targetIdx = validGroupedRows.findIndex(
                          (g) =>
                            g.day ===
                            allDaysInSearch[allDaysInSearch.length - 1],
                        );
                      }

                      if (targetIdx !== -1) {
                        handleNavigateDay(() => goToDay(targetIdx));
                      }
                    }
                  }}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border font-semibold text-xs sm:text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${
                    isActive
                      ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white border-blue-600 shadow-lg scale-110"
                      : hasData
                        ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white hover:border-slate-600"
                        : "bg-slate-800/30 text-slate-500 border-slate-700/50 hover:bg-slate-700/50 hover:text-slate-400"
                  }`}
                  title={`Hari ${day}${!hasData ? " (Tidak ada data)" : ""}`}
                >
                  {day}
                </button>
              );
            };

            // Fungsi buat ellipsis
            const createEllipsis = (key) => (
              <span
                key={key}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-slate-500 font-bold text-xs sm:text-sm"
              >
                ...
              </span>
            );

            // Pagination logic: selalu tampilkan pagination normal dengan ellipsis
            const showAroundCurrent = 1;
            const startIndex = Math.max(1, currentDay - showAroundCurrent);
            const endIndex = Math.min(
              maxDays - 1,
              currentDay + showAroundCurrent,
            );

            const dayButtons = [];
            // Always show first day
            dayButtons.push(createDayButton(1));
            // Ellipsis jika ada gap
            if (startIndex > 2) dayButtons.push(createEllipsis("ellipsis1"));
            // Days around current
            for (let i = startIndex; i <= endIndex; i++) {
              if (i !== 1 && i !== maxDays) {
                dayButtons.push(createDayButton(i));
              }
            }
            // Ellipsis jika ada gap
            if (endIndex < maxDays - 1)
              dayButtons.push(createEllipsis("ellipsis2"));
            // Always show last day
            if (maxDays > 1) dayButtons.push(createDayButton(maxDays));
            // Gabungkan prev, dayButtons, next
            return [prevButton, ...dayButtons, nextButton];
          })()}
        </div>
      </div>

      {/* Loading Popup */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700 shadow-2xl mx-4">
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              <span className="text-white font-medium text-sm sm:text-base">
                Memuat data...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleCardsView;
