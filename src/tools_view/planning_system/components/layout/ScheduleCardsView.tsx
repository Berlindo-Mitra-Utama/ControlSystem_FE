import React, { useState, useEffect } from "react";
import { ScheduleItem, ScheduleTableProps } from "../../types/scheduleTypes";
import {
  getDaysInMonth,
  getDayName,
  isWeekend,
  formatValidDate,
} from "../../utils/scheduleDateUtils";
import {
  calculateOutputFields,
  checkValidation,
} from "../../utils/scheduleCalcUtils";
import StatusBadge from "../ui/StatusBadge";
import DataCard from "../ui/DataCard";
import EditableField from "../ui/EditableField";

// Fungsi untuk mendapatkan jumlah hari maksimal dalam bulan berdasarkan scheduleName
const getMaxDaysInMonth = (scheduleName: string): number => {
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

  let monthIndex = -1;
  let year = new Date().getFullYear();

  // Cari bulan dalam scheduleName
  for (let i = 0; i < months.length; i++) {
    if (scheduleName.includes(months[i])) {
      monthIndex = i;
      break;
    }
  }

  // Extract tahun menggunakan regex
  const yearMatch = scheduleName.match(/(\d{4})/);
  if (yearMatch && yearMatch[1]) {
    year = parseInt(yearMatch[1]);
  }

  // Jika bulan tidak ditemukan, gunakan default
  if (monthIndex === -1) {
    monthIndex = 6; // Juli sebagai default
    year = 2025;
  }

  return getDaysInMonth(monthIndex, year);
};

interface ScheduleCardsViewProps {
  schedule: ScheduleItem[];
  editingRow: string | null;
  editForm: Partial<ScheduleItem>;
  startEdit: (item: ScheduleItem) => void;
  saveEdit: (itemId: string) => void;
  cancelEdit: () => void;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<ScheduleItem>>>;
  initialStock: number;
  timePerPcs: number;
  scheduleName?: string;
  searchDate?: string;
}

const ScheduleCardsView: React.FC<ScheduleCardsViewProps> = ({
  schedule,
  editingRow,
  editForm,
  startEdit,
  saveEdit,
  cancelEdit,
  setEditForm,
  initialStock,
  timePerPcs = 257,
  scheduleName,
  searchDate = "",
}) => {
  // State untuk loading popup
  const [isLoading, setIsLoading] = useState(false);
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
                                <svg
                                  className="w-3 h-3"
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
                          <svg
                            className="w-6 h-6 sm:w-8 sm:h-8 text-red-400"
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
                      const isEditing = editingRow === row.id;

                      // Output 1 jam
                      const outputPerHour =
                        timePerPcs > 0 ? Math.floor(3600 / timePerPcs) : 0;
                      // Akumulasi Delivery Shift 1 & 2
                      let akumulasiDeliveryShift1 = 0;
                      let akumulasiDeliveryShift2 = 0;

                      // Deklarasi prevDayGroup dipindahkan ke sini
                      const prevDayGroup = groupedRows[currentDayIdx - 1];

                      if (row.shift === "1") {
                        // Untuk shift 1 hari pertama, akumulasi = delivery
                        if (currentDayIdx === 0) {
                          akumulasiDeliveryShift1 = row.delivery || 0;
                        } else {
                          // Untuk shift 1 hari berikutnya, akumulasi = akumulasi shift 2 hari sebelumnya + delivery shift 1
                          const prevDay = prevDayGroup
                            ? prevDayGroup.rows.find((r) => r.shift === "2")
                            : undefined;
                          const prevAkumulasi = prevDay
                            ? (prevDay.akumulasiDelivery ?? 0)
                            : 0;
                          akumulasiDeliveryShift1 =
                            prevAkumulasi + (row.delivery || 0);
                        }
                        // Simpan ke row agar bisa dipakai shift berikutnya
                        row.akumulasiDelivery = akumulasiDeliveryShift1;
                      } else if (row.shift === "2") {
                        // Untuk shift 2, akumulasi = akumulasi shift 1 hari yang sama + delivery shift 2
                        const shift1Row = group.rows.find(
                          (r) => r.shift === "1",
                        );
                        const shift1Akumulasi = shift1Row
                          ? (shift1Row.akumulasiDelivery ?? 0)
                          : 0;
                        akumulasiDeliveryShift2 =
                          shift1Akumulasi + (row.delivery || 0);
                        // Simpan ke row agar bisa dipakai hari berikutnya
                        row.akumulasiDelivery = akumulasiDeliveryShift2;
                      }
                      // Planning (jam) - ceil, 1 digit
                      const planningJam =
                        row.planningPcs && outputPerHour > 0
                          ? (
                              Math.ceil(
                                (row.planningPcs / outputPerHour) * 10,
                              ) / 10
                            ).toFixed(1)
                          : "0.0";
                      // Overtime (jam) - ceil, 1 digit
                      const overtimeJam =
                        row.overtimePcs && outputPerHour > 0
                          ? (
                              Math.ceil(
                                (row.overtimePcs / outputPerHour) * 10,
                              ) / 10
                            ).toFixed(1)
                          : "0.0";
                      // Jam Produksi (Cycle Time) - ceil, 1 digit
                      const hasilProduksi = row.pcs || 0;
                      const jamProduksi =
                        hasilProduksi === 0
                          ? "0.0"
                          : (
                              Math.ceil((hasilProduksi / outputPerHour) * 10) /
                              10
                            ).toFixed(1);
                      // Akumulasi Hasil Produksi
                      let akumulasiHasilProduksi = 0;
                      if (row.shift === "1") {
                        // Untuk shift 1 hari pertama, akumulasi = hasil produksi
                        if (currentDayIdx === 0) {
                          akumulasiHasilProduksi = hasilProduksi;
                        } else {
                          // Untuk shift 1 hari berikutnya, akumulasi = akumulasi shift 2 hari sebelumnya + hasil produksi shift 1
                          const prevDay = prevDayGroup
                            ? prevDayGroup.rows.find((r) => r.shift === "2")
                            : undefined;
                          const prevAkumulasi = prevDay
                            ? (prevDay.akumulasiHasilProduksi ?? 0)
                            : 0;
                          akumulasiHasilProduksi =
                            prevAkumulasi + hasilProduksi;
                        }
                        // Simpan ke row agar bisa dipakai shift berikutnya
                        row.akumulasiHasilProduksi = akumulasiHasilProduksi;
                      } else if (row.shift === "2") {
                        // Untuk shift 2, akumulasi = akumulasi shift 1 hari yang sama + hasil produksi shift 2
                        const shift1Row = group.rows.find(
                          (r) => r.shift === "1",
                        );
                        const shift1Akumulasi = shift1Row
                          ? (shift1Row.akumulasiHasilProduksi ?? 0)
                          : 0;
                        akumulasiHasilProduksi =
                          shift1Akumulasi + hasilProduksi;
                        // Simpan ke row agar bisa dipakai hari berikutnya
                        row.akumulasiHasilProduksi = akumulasiHasilProduksi;
                      }
                      // --- Teori Stock & Rencana Stock Custom ---
                      let teoriStockCustom = 0;
                      let actualStockCustom = 0;
                      let rencanaStockCustom = 0;
                      const isHariPertama =
                        currentDayIdx === 0 && row.shift === "1";
                      const isShift1 = row.shift === "1";
                      const isShift2 = row.shift === "2";
                      const prevDayShift2 = prevDayGroup
                        ? prevDayGroup.rows.find((r) => r.shift === "2")
                        : undefined;

                      // Mengambil stock dari bulan lalu (initialStock) atau dari shift sebelumnya
                      const prevActualStockShift2 = prevDayShift2
                        ? (prevDayShift2.actualStockCustom ?? 0)
                        : initialStock;
                      const prevRencanaStockShift2 = prevDayShift2
                        ? (prevDayShift2.rencanaStockCustom ?? 0)
                        : initialStock;

                      const hasilProduksiShift1 = isShift1 ? hasilProduksi : 0;
                      const hasilProduksiShift2 = isShift2 ? hasilProduksi : 0;
                      const planningPcs = row.planningPcs || 0;
                      const overtimePcs = row.overtimePcs || 0;
                      const delivery = row.delivery || 0;

                      if (isHariPertama) {
                        // Hari pertama shift 1 menggunakan initialStock (stock dari bulan lalu)
                        teoriStockCustom =
                          initialStock + hasilProduksiShift1 - delivery;
                        actualStockCustom =
                          hasilProduksi === 0
                            ? initialStock +
                              planningPcs +
                              overtimePcs -
                              delivery
                            : initialStock + hasilProduksiShift1 - delivery;
                        rencanaStockCustom =
                          initialStock + planningPcs + overtimePcs - delivery;
                      } else if (isShift1) {
                        // Shift 1 di hari berikutnya mengambil sisa stock dari shift 2 hari sebelumnya
                        teoriStockCustom =
                          prevActualStockShift2 +
                          hasilProduksiShift1 -
                          delivery;
                        actualStockCustom =
                          hasilProduksi === 0
                            ? prevActualStockShift2 +
                              planningPcs +
                              overtimePcs -
                              delivery
                            : prevActualStockShift2 +
                              hasilProduksiShift1 -
                              delivery;
                        rencanaStockCustom =
                          prevRencanaStockShift2 +
                          planningPcs +
                          overtimePcs -
                          delivery;
                      } else if (isShift2) {
                        // Shift 2 mengambil sisa stock dari shift 1 di hari yang sama
                        const shift1Row = group.rows.find(
                          (r) => r.shift === "1",
                        );
                        const shift1ActualStock = shift1Row
                          ? (shift1Row.actualStockCustom ?? 0)
                          : 0;

                        teoriStockCustom =
                          shift1ActualStock + hasilProduksiShift2 - delivery;
                        actualStockCustom =
                          hasilProduksi === 0
                            ? shift1ActualStock +
                              planningPcs +
                              overtimePcs -
                              delivery
                            : shift1ActualStock +
                              hasilProduksiShift2 -
                              delivery;
                        rencanaStockCustom =
                          shift1ActualStock +
                          planningPcs +
                          overtimePcs -
                          delivery;
                      }

                      // Simpan ke row agar bisa dipakai shift berikutnya
                      row.teoriStockCustom = teoriStockCustom;
                      row.actualStockCustom = actualStockCustom;
                      row.rencanaStockCustom = rencanaStockCustom;

                      flatIdx++;

                      return (
                        <div
                          key={row.id}
                          className={`bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-700/50 transition-all duration-300 hover:shadow-2xl hover:border-slate-600/50 ${
                            isEditing ? "ring-2 ring-blue-500/50" : ""
                          }`}
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
                                <div className="flex gap-1 sm:gap-2">
                                  {isEditing ? (
                                    <>
                                      <button
                                        onClick={() => saveEdit(row.id)}
                                        className="p-1.5 sm:p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-all"
                                        title="Simpan"
                                      >
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
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={cancelEdit}
                                        className="p-1.5 sm:p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
                                        title="Batal"
                                      >
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
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => startEdit(row)}
                                      className="p-1.5 sm:p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all"
                                      title="Edit"
                                    >
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
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                    </button>
                                  )}
                                </div>
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
                                    <span className="text-sm sm:text-base">
                                      📝
                                    </span>
                                    <span className="text-blue-200/90 font-semibold text-xs">
                                      Planning (pcs)
                                    </span>
                                  </div>
                                  <input
                                    type="number"
                                    step={1}
                                    value={row.planningPcs ?? 0}
                                    onChange={(e) => {
                                      row.planningPcs = Number(e.target.value);
                                      setEditForm((prev) => ({
                                        ...prev,
                                        planningPcs: row.planningPcs,
                                      }));
                                    }}
                                    className="mt-0.5 font-bold text-blue-100 text-base sm:text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                  />
                                </div>
                                <div className="bg-blue-900/80 rounded-2xl p-2 sm:p-3 border border-blue-400 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-blue-400/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <span className="text-sm sm:text-base">
                                      🚚
                                    </span>
                                    <span className="text-blue-200/90 font-semibold text-xs">
                                      Delivery (pcs)
                                    </span>
                                  </div>
                                  <input
                                    type="number"
                                    step={1}
                                    value={row.delivery ?? 0}
                                    onChange={(e) => {
                                      row.delivery = Number(e.target.value);
                                      setEditForm((prev) => ({
                                        ...prev,
                                        delivery: row.delivery,
                                      }));
                                    }}
                                    className="mt-0.5 font-bold text-blue-100 text-base sm:text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                  />
                                </div>
                                <div className="bg-blue-900/80 rounded-2xl p-2 sm:p-3 border border-blue-400 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-blue-400/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <span className="text-sm sm:text-base">
                                      ⏱️
                                    </span>
                                    <span className="text-blue-200/90 font-semibold text-xs">
                                      Overtime (pcs)
                                    </span>
                                  </div>
                                  <input
                                    type="number"
                                    step={1}
                                    value={row.overtimePcs ?? 0}
                                    onChange={(e) => {
                                      row.overtimePcs = Number(e.target.value);
                                      setEditForm((prev) => ({
                                        ...prev,
                                        overtimePcs: row.overtimePcs,
                                      }));
                                    }}
                                    className="mt-0.5 font-bold text-blue-100 text-base sm:text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                  />
                                </div>
                                <div className="bg-blue-900/80 rounded-2xl p-2 sm:p-3 border border-blue-400 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-blue-400/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <span className="text-sm sm:text-base">
                                      🏭
                                    </span>
                                    <span className="text-blue-200/90 font-semibold text-xs">
                                      Hasil Produksi (pcs)
                                    </span>
                                  </div>
                                  <input
                                    type="number"
                                    step={1}
                                    value={row.pcs ?? 0}
                                    onChange={(e) => {
                                      row.pcs = Number(e.target.value);
                                      setEditForm((prev) => ({
                                        ...prev,
                                        pcs: row.pcs,
                                      }));
                                    }}
                                    className="mt-0.5 font-bold text-blue-100 text-base sm:text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                  />
                                </div>
                                <div className="bg-blue-900/80 rounded-2xl p-2 sm:p-3 border border-blue-400 flex flex-col items-center min-w-[100px] sm:min-w-[110px] shadow-lg shadow-blue-400/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <span className="text-sm sm:text-base">
                                      ⏲️
                                    </span>
                                    <span className="text-blue-200/90 font-semibold text-xs">
                                      Jam Produksi Aktual
                                    </span>
                                  </div>
                                  <input
                                    type="number"
                                    step={0.1}
                                    value={row.jamProduksiAktual ?? 0}
                                    onChange={(e) => {
                                      row.jamProduksiAktual = Number(
                                        e.target.value,
                                      );
                                      setEditForm((prev) => ({
                                        ...prev,
                                        jamProduksiAktual:
                                          row.jamProduksiAktual,
                                      }));
                                    }}
                                    className="mt-0.5 font-bold text-blue-100 text-base sm:text-lg bg-transparent border-none text-center w-full focus:outline-none"
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
                                      <span className="text-sm sm:text-base">
                                        🚚
                                      </span>
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
                                      <span className="text-sm sm:text-base">
                                        🚚
                                      </span>
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
                                    <span className="text-sm sm:text-base">
                                      ⏰
                                    </span>
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
                                    <span className="text-sm sm:text-base">
                                      ⏱️
                                    </span>
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
                                    <span className="text-sm sm:text-base">
                                      ⏲️
                                    </span>
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
                                    <span className="text-sm sm:text-base">
                                      🏭
                                    </span>
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
                                    <span className="text-sm sm:text-base">
                                      🧮
                                    </span>
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
                                    <span className="text-sm sm:text-base">
                                      🟦
                                    </span>
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
                                    <span className="text-sm sm:text-base">
                                      🟩
                                    </span>
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
          {/* Generate compact day navigation buttons based on available data */}
          {(() => {
            // Get all available days from validGroupedRows
            const availableDays = validGroupedRows
              .map((group) => group.day)
              .sort((a, b) => a - b);
            const currentDay =
              validGroupedRows[currentDayIdx]?.day || availableDays[0] || 1;
            const dayButtons = [];

            // Function to create day button
            const createDayButton = (day: number) => {
              const hasData = validGroupedRows.some(
                (group) => group.day === day,
              );
              const isActive = currentDay === day;

              return (
                <button
                  key={day}
                  onClick={() => {
                    const dayIndex = validGroupedRows.findIndex(
                      (group) => group.day === day,
                    );
                    if (dayIndex !== -1) {
                      handleNavigateDay(() => goToDay(dayIndex));
                    }
                  }}
                  disabled={!hasData}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border font-semibold text-xs sm:text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${
                    !hasData
                      ? "bg-slate-800/50 text-slate-500 border-slate-700 cursor-not-allowed"
                      : isActive
                        ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white border-blue-600 shadow-lg scale-110"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white hover:border-slate-600"
                  }`}
                  title={
                    hasData ? `Hari ${day}` : `Tidak ada data untuk hari ${day}`
                  }
                >
                  {day}
                </button>
              );
            };

            // Function to create ellipsis
            const createEllipsis = (key: string) => (
              <span
                key={key}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-slate-500 font-bold text-xs sm:text-sm"
              >
                ...
              </span>
            );

            // If no data available, show empty state
            if (availableDays.length === 0) {
              return (
                <div className="text-slate-400 text-sm">
                  Tidak ada data tersedia
                </div>
              );
            }

            // If only one day available, just show that day
            if (availableDays.length === 1) {
              return [createDayButton(availableDays[0])];
            }

            // Get first and last available days
            const firstDay = availableDays[0];
            const lastDay = availableDays[availableDays.length - 1];

            // Always show first available day
            dayButtons.push(createDayButton(firstDay));

            // Show days around current day
            const showAroundCurrent = 2; // Show 2 days before and after current
            const currentDayIndex = availableDays.indexOf(currentDay);
            const startIndex = Math.max(1, currentDayIndex - showAroundCurrent);
            const endIndex = Math.min(
              availableDays.length - 2,
              currentDayIndex + showAroundCurrent,
            );

            // Add ellipsis if there's a gap between first day and current area
            if (startIndex > 1) {
              dayButtons.push(createEllipsis("ellipsis1"));
            }

            // Add days around current day
            for (let i = startIndex; i <= endIndex; i++) {
              const day = availableDays[i];
              if (day !== firstDay && day !== lastDay) {
                dayButtons.push(createDayButton(day));
              }
            }

            // Add ellipsis if there's a gap between current area and last day
            if (endIndex < availableDays.length - 2) {
              dayButtons.push(createEllipsis("ellipsis2"));
            }

            // Always show last available day if different from first day
            if (lastDay !== firstDay) {
              dayButtons.push(createDayButton(lastDay));
            }

            return dayButtons;
          })()}
        </div>
      </div>

      {/* Loading Popup */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700 shadow-2xl mx-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-500"></div>
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
