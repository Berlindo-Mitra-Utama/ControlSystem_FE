import React, { useState, useEffect } from "react";
("use client");

import * as XLSX from "xlsx";
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
import ScheduleTableView from "./ScheduleTableView";

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

const ScheduleCards: React.FC<ScheduleTableProps> = (props) => {
  const {
    schedule,
    editingRow,
    editForm,
    startEdit,
    saveEdit,
    cancelEdit,
    setEditForm,
    initialStock,
    timePerPcs = 257,
  } = props;
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
  const [searchDate, setSearchDate] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "timeline">("cards");
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
  const maxDaysInMonth = getMaxDaysInMonth(props.scheduleName || "Juli 2025");
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

  // Fungsi untuk download schedule sebagai file Excel
  const handleDownloadExcel = () => {
    // Persiapkan data untuk Excel
    const scheduleData = flatRows.map((item, index) => {
      const calculated = calculateOutputFields(
        item,
        index,
        flatRows,
        timePerPcs,
        initialStock,
      );
      return {
        No: index + 1,
        Hari: item.day,
        Shift: item.shift,
        Waktu: item.shift === "1" ? "07:30-16:30" : "19:30-04:30",
        Status: item.status,
        "Stok Awal": calculated.prevStock,
        Delivery: item.delivery || 0,
        "Planning Hour": item.planningHour || 0,
        "Overtime Hour": item.overtimeHour || 0,
        "Planning PCS": calculated.planningPcs,
        "Overtime PCS": calculated.overtimePcs,
        "Hasil Produksi": calculated.hasilProduksi,
        "Actual Stock": calculated.actualStock,
        "Jam Produksi Aktual": item.jamProduksiAktual || 0,
        Catatan: item.notes || "",
      };
    });

    // Buat workbook baru
    const wb = XLSX.utils.book_new();

    // Buat worksheet untuk data schedule
    const ws = XLSX.utils.json_to_sheet(scheduleData);

    // Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(wb, ws, "Schedule");

    // Download file Excel
    XLSX.writeFile(
      wb,
      `schedule_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 p-6 border-b border-slate-600/50">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              🏭 Dashboard Produksi
            </h2>
            <p className="text-slate-400">
              Monitoring dan perencanaan produksi harian dalam tampilan card
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
            {/* Download Excel Button */}
            <button
              onClick={handleDownloadExcel}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center gap-2"
              title="Download Excel"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Excel
            </button>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-600">
              <button
                onClick={() => setViewMode("cards")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === "cards"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === "timeline"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                Table
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                placeholder="Cari tanggal..."
                className="w-full sm:w-64 pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchDate && (
                <button
                  onClick={() => setSearchDate("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-red-400"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === "cards" ? (
          <div className="space-y-8">
            {/* Tampilkan hanya data untuk hari saat ini */}
            {currentDayData.map((group, groupIdx) => {
              // Hitung flatIdx berdasarkan posisi sebenarnya dalam groupedRows
              let flatIdx = groupedRows
                .slice(0, currentDayIdx)
                .reduce((sum, g) => sum + g.rows.length, 0);

              return (
                <div key={group.day} className="space-y-6">
                  {/* Enhanced Day Header */}
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {group.day}
                      </div>
                      <div>
                        {(() => {
                          const dateInfo = formatValidDate(
                            group.day,
                            props.scheduleName || "Februari 2025",
                          );
                          return (
                            <>
                              <h3
                                className={`text-2xl font-bold transition-colors ${
                                  dateInfo.isValid
                                    ? "text-white"
                                    : "text-amber-400"
                                }`}
                              >
                                {dateInfo.formattedDate}
                              </h3>
                              <div className="flex items-center gap-3">
                                <p className="text-slate-400">
                                  {dateInfo.dayName} • {group.rows.length} shift
                                  produksi
                                </p>
                                {!dateInfo.isValid && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full border border-amber-500/30">
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
                                    Tanggal disesuaikan
                                  </span>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Navigation Info */}
                    <div className="ml-auto flex items-center gap-2 text-sm text-slate-400">
                      <span className="px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700">
                        Hari {currentDayIdx + 1} dari {totalValidDays}
                      </span>
                    </div>
                  </div>

                  {/* Shifts Grid */}
                  {(() => {
                    const isWeekendDay = isWeekend(
                      group.day,
                      props.scheduleName || "Juli 2025",
                    );

                    if (isWeekendDay) {
                      return (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                              <svg
                                className="w-8 h-8 text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-red-400 mb-2">
                              Hari Libur
                            </h4>
                            <p className="text-red-300/70">
                              Tidak ada shift produksi pada hari ini
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="grid gap-6 lg:grid-cols-2">
                        {group.rows.map((row) => {
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
                                  Math.ceil(
                                    (hasilProduksi / outputPerHour) * 10,
                                  ) / 10
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
                          // Hapus baris ini karena sudah dideklarasikan di atas
                          // const prevDayGroup = groupedRows[currentDayIdx - 1];
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

                          const hasilProduksiShift1 = isShift1
                            ? hasilProduksi
                            : 0;
                          const hasilProduksiShift2 = isShift2
                            ? hasilProduksi
                            : 0;
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
                              initialStock +
                              planningPcs +
                              overtimePcs -
                              delivery;
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
                              shift1ActualStock +
                              hasilProduksiShift2 -
                              delivery;
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
                              className={`bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border transition-all duration-300 hover:shadow-2xl ${
                                validationAlerts.length > 0
                                  ? "border-amber-500/50 shadow-amber-500/20"
                                  : "border-slate-700/50 hover:border-slate-600/50"
                              } ${isEditing ? "ring-2 ring-blue-500/50" : ""}`}
                            >
                              {/* Card Header */}
                              <div className="p-6 border-b border-slate-700/50">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                      {row.shift}
                                    </div>
                                    <div>
                                      <h4 className="text-xl font-bold text-white">
                                        Shift {row.shift}
                                      </h4>
                                      <p className="text-slate-400 text-sm">
                                        {row.shift === "1"
                                          ? "07:30-16:30"
                                          : "19:30-04:30"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <StatusBadge status={row.status} />
                                    <div className="flex gap-2">
                                      {isEditing ? (
                                        <>
                                          <button
                                            onClick={() => saveEdit(row.id)}
                                            className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-all"
                                            title="Simpan"
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
                                                d="M5 13l4 4L19 7"
                                              />
                                            </svg>
                                          </button>
                                          <button
                                            onClick={cancelEdit}
                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
                                            title="Batal"
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
                                                d="M6 18L18 6M6 6l12 12"
                                              />
                                            </svg>
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          onClick={() => startEdit(row)}
                                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all"
                                          title="Edit"
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
                                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                            />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {/* Quick Stats */}
                              </div>

                              {/* Card Content */}
                              <div className="p-6 space-y-6">
                                {/* Tampilkan nilai input meski tidak sedang edit */}
                                <div className="space-y-2 mt-2">
                                  <div className="text-blue-300 font-bold text-xs mb-1 pl-1">
                                    Input Parameter
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="bg-blue-900/80 rounded-2xl p-3 border border-blue-400 flex flex-col items-center min-w-[110px] shadow-lg shadow-blue-400/40 w-full">
                                      <div className="flex items-center gap-1 mb-0.5 w-full">
                                        <span className="text-base">📝</span>
                                        <span className="text-blue-200/90 font-semibold text-xs">
                                          Planning (pcs)
                                        </span>
                                      </div>
                                      <input
                                        type="number"
                                        step={1}
                                        value={row.planningPcs ?? 0}
                                        onChange={(e) => {
                                          row.planningPcs = Number(
                                            e.target.value,
                                          );
                                          setEditForm((prev) => ({
                                            ...prev,
                                            planningPcs: row.planningPcs,
                                          }));
                                        }}
                                        className="mt-0.5 font-bold text-blue-100 text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                      />
                                    </div>
                                    <div className="bg-blue-900/80 rounded-2xl p-3 border border-blue-400 flex flex-col items-center min-w-[110px] shadow-lg shadow-blue-400/40 w-full">
                                      <div className="flex items-center gap-1 mb-0.5 w-full">
                                        <span className="text-base">🚚</span>
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
                                        className="mt-0.5 font-bold text-blue-100 text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                      />
                                    </div>
                                    <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30 w-full">
                                      <div className="flex items-center gap-1 mb-0.5 w-full">
                                        <span className="text-base">⏱️</span>
                                        <span className="text-blue-200/90 font-semibold text-xs">
                                          Overtime (pcs)
                                        </span>
                                      </div>
                                      <input
                                        type="number"
                                        step={1}
                                        value={row.overtimePcs ?? 0}
                                        onChange={(e) => {
                                          row.overtimePcs = Number(
                                            e.target.value,
                                          );
                                          setEditForm((prev) => ({
                                            ...prev,
                                            overtimePcs: row.overtimePcs,
                                          }));
                                        }}
                                        className="mt-0.5 font-bold text-blue-100 text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                      />
                                    </div>
                                    <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30 w-full">
                                      <div className="flex items-center gap-1 mb-0.5 w-full">
                                        <span className="text-base">🏭</span>
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
                                        className="mt-0.5 font-bold text-blue-100 text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                      />
                                    </div>
                                    <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30 w-full">
                                      <div className="flex items-center gap-1 mb-0.5 w-full">
                                        <span className="text-base">⏲️</span>
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
                                        className="mt-0.5 font-bold text-blue-100 text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                                {/* Output Section: Custom Output sesuai rumus user */}
                                <div className="space-y-2 mt-2">
                                  <div className="text-blue-300 font-bold text-xs mb-1 pl-1">
                                    Output Parameter
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Akumulasi Delivery hanya tampil di shift yang sesuai */}
                                    {row.shift === "1" && (
                                      <div className="bg-blue-900/80 rounded-2xl p-3 border border-blue-400 flex flex-col items-center min-w-[110px] shadow-lg shadow-blue-400/40 w-full">
                                        <div className="flex items-center gap-1 mb-0.5 w-full">
                                          <span className="text-base">🚚</span>
                                          <span className="font-semibold text-xs text-blue-200/90">
                                            Akumulasi Delivery Shift 1
                                          </span>
                                        </div>
                                        <span className="font-bold text-blue-100 text-lg mt-0.5">
                                          {akumulasiDeliveryShift1}
                                        </span>
                                      </div>
                                    )}
                                    {row.shift === "2" && (
                                      <div className="bg-blue-900/80 rounded-2xl p-3 border border-blue-400 flex flex-col items-center min-w-[110px] shadow-lg shadow-blue-400/40 w-full">
                                        <div className="flex items-center gap-1 mb-0.5 w-full">
                                          <span className="text-base">🚚</span>
                                          <span className="font-semibold text-xs text-blue-200/90">
                                            Akumulasi Delivery Shift 2
                                          </span>
                                        </div>
                                        <span className="font-bold text-blue-100 text-lg mt-0.5">
                                          {akumulasiDeliveryShift2}
                                        </span>
                                      </div>
                                    )}
                                    <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30 w-full">
                                      <div className="flex items-center gap-1 mb-0.5 w-full">
                                        <span className="text-base">�</span>
                                        <span className="font-semibold text-xs text-blue-200/90">
                                          Planning (jam)
                                        </span>
                                      </div>
                                      <span className="font-bold text-blue-100 text-lg mt-0.5">
                                        {planningJam}
                                      </span>
                                    </div>
                                    <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30 w-full">
                                      <div className="flex items-center gap-1 mb-0.5 w-full">
                                        <span className="text-base">⏱️</span>
                                        <span className="font-semibold text-xs text-blue-200/90">
                                          Overtime (jam)
                                        </span>
                                      </div>
                                      <span className="font-bold text-blue-100 text-lg mt-0.5">
                                        {overtimeJam}
                                      </span>
                                    </div>
                                    <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30 w-full">
                                      <div className="flex items-center gap-1 mb-0.5 w-full">
                                        <span className="text-base">⏲️</span>
                                        <span className="font-semibold text-xs text-blue-200/90">
                                          Jam Produksi (Cycle Time)
                                        </span>
                                      </div>
                                      <span className="font-bold text-blue-100 text-lg mt-0.5">
                                        {jamProduksi}
                                      </span>
                                    </div>
                                    <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30 w-full">
                                      <div className="flex items-center gap-1 mb-0.5 w-full">
                                        <span className="text-base">🏭</span>
                                        <span className="font-semibold text-xs text-blue-200/90">
                                          Akumulasi Hasil Produksi
                                        </span>
                                      </div>
                                      <span className="font-bold text-blue-100 text-lg mt-0.5">
                                        {akumulasiHasilProduksi}
                                      </span>
                                    </div>
                                    <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30 w-full">
                                      <div className="flex items-center gap-1 mb-0.5 w-full">
                                        <span className="text-base">🧮</span>
                                        <span className="font-semibold text-xs text-blue-200/90">
                                          Teori Stock
                                        </span>
                                      </div>
                                      <span className="font-bold text-blue-100 text-lg mt-0.5">
                                        {teoriStockCustom}
                                      </span>
                                    </div>
                                    <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30 w-full">
                                      <div className="flex items-center gap-1 mb-0.5 w-full">
                                        <span className="text-base">🟦</span>
                                        <span className="font-semibold text-xs text-blue-200/90">
                                          Actual Stock
                                        </span>
                                      </div>
                                      <span className="font-bold text-blue-100 text-lg mt-0.5">
                                        {actualStockCustom}
                                      </span>
                                    </div>
                                    <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30 w-full">
                                      <div className="flex items-center gap-1 mb-0.5 w-full">
                                        <span className="text-base">🟩</span>
                                        <span className="font-semibold text-xs text-blue-200/90">
                                          Rencana Stock
                                        </span>
                                      </div>
                                      <span className="font-bold text-blue-100 text-lg mt-0.5">
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

            <div className="mt-8 flex items-center justify-center gap-2">
              {/* PREV button */}
              <button
                onClick={() => handleNavigateDay(goToPreviousDay)}
                disabled={currentDayIdx === 0}
                className={`px-4 py-2 rounded-full border flex items-center gap-2 font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${currentDayIdx === 0 ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed" : "bg-gradient-to-br from-blue-600 to-blue-500 text-white border-blue-600 hover:from-blue-700 hover:to-blue-600 hover:shadow-lg"}`}
                style={{ minWidth: 60 }}
              >
                PREV
              </button>

              {/* Page buttons with ellipsis */}
              {(() => {
                const maxPageShow = 7;
                const items = [];
                // Helper for button style
                const getBtnClass = (isCurrent: boolean) =>
                  isCurrent
                    ? "w-9 h-9 rounded-full border flex items-center justify-center font-semibold text-sm mx-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg scale-110 bg-gradient-to-br from-yellow-400 to-emerald-500 text-white border-yellow-400 ring-2 ring-yellow-300"
                    : "w-9 h-9 rounded-full border flex items-center justify-center font-semibold text-sm mx-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-slate-900 text-slate-300 border-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg hover:scale-105";
                if (totalDays <= maxPageShow) {
                  for (let i = 0; i < totalDays; i++) {
                    items.push(
                      <button
                        key={i}
                        onClick={() => handleNavigateDay(() => goToDay(i))}
                        className={getBtnClass(currentDayIdx === i)}
                        style={{
                          transition: "transform 0.3s cubic-bezier(.4,2,.3,1)",
                        }}
                        disabled={currentDayIdx === i}
                      >
                        {validGroupedRows[i].day}
                      </button>,
                    );
                  }
                } else {
                  // Always show first, last, current, and neighbors
                  if (currentDayIdx > 1) {
                    items.push(
                      <button
                        key={0}
                        onClick={() => handleNavigateDay(() => goToDay(0))}
                        className={getBtnClass(currentDayIdx === 0)}
                        style={{
                          transition: "transform 0.3s cubic-bezier(.4,2,.3,1)",
                        }}
                        disabled={currentDayIdx === 0}
                      >
                        {validGroupedRows[0].day}
                      </button>,
                    );
                  }
                  if (currentDayIdx > 2) {
                    items.push(
                      <span
                        key="start-ellipsis"
                        className="px-1 text-slate-500"
                      >
                        ...
                      </span>,
                    );
                  }
                  // Show previous, current, next
                  for (
                    let i = Math.max(0, currentDayIdx - 1);
                    i <= Math.min(totalDays - 1, currentDayIdx + 1);
                    i++
                  ) {
                    // Always show current day button, but with distinct style
                    items.push(
                      <button
                        key={i}
                        onClick={() => handleNavigateDay(() => goToDay(i))}
                        className={getBtnClass(currentDayIdx === i)}
                        style={{
                          transition: "transform 0.3s cubic-bezier(.4,2,.3,1)",
                        }}
                        disabled={currentDayIdx === i}
                      >
                        {validGroupedRows[i].day}
                      </button>,
                    );
                  }
                  if (currentDayIdx < totalDays - 3) {
                    items.push(
                      <span key="end-ellipsis" className="px-1 text-slate-500">
                        ...
                      </span>,
                    );
                  }
                  if (currentDayIdx < totalDays - 2) {
                    items.push(
                      <button
                        key={totalDays - 1}
                        onClick={() =>
                          handleNavigateDay(() => goToDay(totalDays - 1))
                        }
                        className={getBtnClass(currentDayIdx === totalDays - 1)}
                        style={{
                          transition: "transform 0.3s cubic-bezier(.4,2,.3,1)",
                        }}
                        disabled={currentDayIdx === totalDays - 1}
                      >
                        {validGroupedRows[totalDays - 1].day}
                      </button>,
                    );
                  }
                }
                return items;
              })()}

              {/* NEXT button */}
              <button
                onClick={() => handleNavigateDay(goToNextDay)}
                disabled={currentDayIdx === totalDays - 1}
                className={`px-4 py-2 rounded-full border flex items-center gap-2 font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${currentDayIdx === totalDays - 1 ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed" : "bg-gradient-to-br from-blue-600 to-blue-500 text-white border-blue-600 hover:from-blue-700 hover:to-blue-600 hover:shadow-lg"}`}
                style={{ minWidth: 60 }}
              >
                NEXT
              </button>

              {/* Loading Popup */}
              {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-all">
                  <div className="flex flex-col items-center gap-4 p-8 bg-gradient-to-br from-blue-700 via-slate-800 to-blue-900 rounded-2xl shadow-2xl border border-blue-600 animate-fade-in">
                    <svg
                      className="animate-spin w-12 h-12 text-blue-400"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-20"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        d="M12 2a10 10 0 0 1 10 10"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="text-lg font-bold text-white">
                      Memuat data hari...
                    </div>
                    <div className="text-sm text-blue-200">
                      Mohon tunggu sebentar
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <ScheduleTableView
            validGroupedRows={validGroupedRows}
            flatRows={flatRows}
            timePerPcs={timePerPcs}
            initialStock={initialStock}
            scheduleName={props.scheduleName}
          />
        )}
      </div>
    </div>
  );
};

export default ScheduleCards;
