"use client";

import type React from "react";
import { useState } from "react";
import * as XLSX from "xlsx";

interface ScheduleItem {
  id: string;
  day: number;
  shift: string;
  type: string;
  pcs: number;
  time: string;
  status: "Normal" | "Gangguan" | "Completed";
  actualPcs?: number;
  notes?: string;
  delivery?: number;
  planningPcs?: number;
  overtimePcs?: number;
  sisaPlanningPcs?: number;
  sisaStock?: number;
  selisih?: number;
  planningHour?: number;
  overtimeHour?: number;
  jamProduksiAktual?: number;
  akumulasiDelivery?: number;
  hasilProduksi?: number;
  akumulasiHasilProduksi?: number;
  jamProduksiCycleTime?: number;
  selisihDetikPerPcs?: number;
  selisihCycleTime?: number;
  selisihCycleTimePcs?: number;
  teoriStock?: number;
  rencanaStock?: number;
  // Tambahan untuk custom stock
  teoriStockCustom?: number;
  rencanaStockCustom?: number;
}

interface ScheduleTableProps {
  schedule: ScheduleItem[];
  editingRow: string | null;
  editForm: Partial<ScheduleItem>;
  startEdit: (item: ScheduleItem) => void;
  saveEdit: (itemId: string) => void;
  cancelEdit: () => void;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<ScheduleItem>>>;
  initialStock: number;
  timePerPcs?: number;
}

const ScheduleCards: React.FC<ScheduleTableProps> = ({
  schedule,
  editingRow,
  editForm,
  startEdit,
  saveEdit,
  cancelEdit,
  setEditForm,
  initialStock,
  timePerPcs = 257,
}) => {
  const [searchDate, setSearchDate] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "timeline">("cards");
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});

  const filteredSchedule = searchDate
    ? schedule.filter((row) => row.day.toString().includes(searchDate.trim()))
    : schedule;

  const groupedRows: { day: number; rows: typeof filteredSchedule }[] = [];
  filteredSchedule.forEach((row) => {
    const lastGroup = groupedRows[groupedRows.length - 1];
    if (lastGroup && lastGroup.day === row.day) {
      lastGroup.rows.push(row);
    } else {
      groupedRows.push({ day: row.day, rows: [row] });
    }
  });

  const calculateOutputFields = (
    row: ScheduleItem,
    index: number,
    allRows: ScheduleItem[],
  ) => {
    const planningHour = row.planningHour || 0;
    const overtimeHour = row.overtimeHour || 0;
    const delivery = row.delivery || 0;

    const akumulasiDelivery = allRows
      .slice(0, index)
      .reduce((sum, r) => sum + (r.delivery || 0), 0);
    const planningPcs =
      planningHour > 0 ? Math.floor((planningHour * 3600) / timePerPcs) : 0;
    const overtimePcs =
      overtimeHour > 0 ? Math.floor((overtimeHour * 3600) / timePerPcs) : 0;
    const hasilProduksi = planningPcs + overtimePcs;

    const akumulasiHasilProduksi =
      allRows.slice(0, index).reduce((sum, r) => {
        const rPlanningPcs = r.planningHour
          ? Math.floor((r.planningHour * 3600) / timePerPcs)
          : 0;
        const rOvertimePcs = r.overtimeHour
          ? Math.floor((r.overtimeHour * 3600) / timePerPcs)
          : 0;
        return sum + rPlanningPcs + rOvertimePcs;
      }, 0) + hasilProduksi;

    const jamProduksiCycleTime =
      hasilProduksi > 0 ? (hasilProduksi * timePerPcs) / 3600 : 0;
    const selisihDetikPerPcs =
      row.jamProduksiAktual && hasilProduksi > 0
        ? timePerPcs - (row.jamProduksiAktual * 3600) / hasilProduksi
        : 0;
    const selisihCycleTime = row.jamProduksiAktual
      ? jamProduksiCycleTime - row.jamProduksiAktual
      : 0;
    const selisihCycleTimePcs =
      selisihCycleTime > 0
        ? Math.floor((selisihCycleTime * 3600) / timePerPcs)
        : 0;

    const prevStock =
      index === 0
        ? initialStock
        : allRows[index - 1].rencanaStock || initialStock;
    const teoriStock = prevStock + hasilProduksi;
    const rencanaStock = prevStock + hasilProduksi - delivery;

    return {
      akumulasiDelivery,
      planningPcs,
      overtimePcs,
      hasilProduksi,
      akumulasiHasilProduksi,
      jamProduksiCycleTime,
      selisihDetikPerPcs,
      selisihCycleTime,
      selisihCycleTimePcs,
      teoriStock,
      rencanaStock,
      prevStock,
    };
  };

  const checkValidation = (row: ScheduleItem, calculated: any) => {
    const alerts: string[] = [];
    if (
      calculated.rencanaStock >= (row.delivery || 0) &&
      (row.delivery || 0) > 0
    ) {
      alerts.push("Stok sudah cukup, tidak perlu produksi.");
    }
    const totalWaktuTersedia =
      (row.planningHour || 0) + (row.overtimeHour || 0);
    const waktuDibutuhkan =
      (((row.delivery || 0) -
        calculated.rencanaStock +
        calculated.hasilProduksi) *
        timePerPcs) /
      3600;
    if (totalWaktuTersedia < waktuDibutuhkan && waktuDibutuhkan > 0) {
      alerts.push(
        "Waktu produksi tidak cukup untuk memenuhi kebutuhan produksi.",
      );
    }
    return alerts;
  };

  const flatRows: ScheduleItem[] = groupedRows.flatMap((g) => g.rows);

  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      Normal: {
        bg: "bg-emerald-500/20",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        icon: "✓",
      },
      Gangguan: {
        bg: "bg-red-500/20",
        text: "text-red-400",
        border: "border-red-500/30",
        icon: "⚠",
      },
      Completed: {
        bg: "bg-blue-500/20",
        text: "text-blue-400",
        border: "border-blue-500/30",
        icon: "✓",
      },
    };
    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.Normal;
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
      >
        <span className="text-xs">{config.icon}</span>
        {status}
      </span>
    );
  };

  const DataCard = ({ title, value, unit = "", className = "", icon = "" }) => (
    <div
      className={`bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <h4 className="text-sm font-medium text-slate-400">{title}</h4>
      </div>
      <div className="text-xl font-bold text-white font-mono">
        {typeof value === "number" ? value.toLocaleString("id-ID") : value}
        {unit && <span className="text-sm text-slate-400 ml-1">{unit}</span>}
      </div>
    </div>
  );

  const EditableField = ({
    label,
    value,
    field,
    type = "text",
    step,
    placeholder,
    unit = "",
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      {editingRow ? (
        <input
          type={type}
          step={step}
          value={
            editForm[field] !== undefined ? editForm[field] : (value ?? "")
          }
          onChange={(e) => {
            const val =
              type === "number"
                ? (step
                    ? Number.parseFloat(e.target.value)
                    : Number.parseInt(e.target.value)) || 0
                : e.target.value;
            setEditForm((prev) => ({ ...prev, [field]: val }));
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      ) : (
        <div className="px-3 py-2 bg-slate-900/50 rounded-lg text-white font-mono">
          {typeof value === "number"
            ? value.toLocaleString("id-ID")
            : value || "-"}
          {unit && <span className="text-slate-400 ml-1">{unit}</span>}
        </div>
      )}
    </div>
  );

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
      const calculated = calculateOutputFields(item, index, flatRows);
      return {
        No: index + 1,
        Hari: item.day,
        Shift: item.shift,
        Waktu: item.time,
        Status: item.status,
        "Stok Awal": calculated.prevStock,
        Delivery: item.delivery || 0,
        "Planning Hour": item.planningHour || 0,
        "Overtime Hour": item.overtimeHour || 0,
        "Planning PCS": calculated.planningPcs,
        "Overtime PCS": calculated.overtimePcs,
        "Hasil Produksi": calculated.hasilProduksi,
        "Stok Akhir": calculated.rencanaStock,
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
                📋 Cards
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === "timeline"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                📅 Timeline
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
            {groupedRows.map((group, groupIdx) => {
              let flatIdx = groupedRows
                .slice(0, groupIdx)
                .reduce((sum, g) => sum + g.rows.length, 0);

              return (
                <div key={group.day} className="space-y-6">
                  {/* Day Header */}
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {group.day}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">
                          {group.day} Juli 2024
                        </h3>
                        <p className="text-slate-400">
                          {group.rows.length} shift produksi
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Shifts Grid */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {group.rows.map((row) => {
                      // --- Custom Output Calculation ---
                      const calculated = calculateOutputFields(
                        row,
                        flatIdx,
                        flatRows,
                      );
                      const validationAlerts = checkValidation(row, calculated);
                      const isEditing = editingRow === row.id;

                      // Output 1 jam
                      const outputPerHour = timePerPcs > 0 ? Math.floor(3600 / timePerPcs) : 0;
                      // Akumulasi Delivery Shift 1 & 2
                      let akumulasiDeliveryShift1 = 0;
                      let akumulasiDeliveryShift2 = 0;
                      if (row.shift === "1") {
                        const prevDay = flatRows.filter(r => r.day === row.day - 1 && r.shift === "2")[0];
                        akumulasiDeliveryShift1 = (prevDay?.delivery || 0) + (row.delivery || 0);
                      } else if (row.shift === "2") {
                        const shift1 = flatRows.filter(r => r.day === row.day && r.shift === "1")[0];
                        akumulasiDeliveryShift2 = (shift1?.delivery || 0) + (row.delivery || 0);
                      }
                      // Planning (jam) - ceil, 1 digit
                      const planningJam = row.planningPcs && outputPerHour > 0 ? (Math.ceil((row.planningPcs / outputPerHour) * 10) / 10).toFixed(1) : "0.0";
                      // Overtime (jam) - ceil, 1 digit
                      const overtimeJam = row.overtimePcs && outputPerHour > 0 ? (Math.ceil((row.overtimePcs / outputPerHour) * 10) / 10).toFixed(1) : "0.0";
                      // Jam Produksi (Cycle Time) - ceil, 1 digit
                      const hasilProduksi = row.pcs || 0;
                      const jamProduksi = hasilProduksi === 0 ? "0.0" : (Math.ceil((hasilProduksi / outputPerHour) * 10) / 10).toFixed(1);
                      // Akumulasi Hasil Produksi
                      let akumulasiHasilProduksi = 0;
                      for (let i = 0; i < flatIdx; i++) {
                        akumulasiHasilProduksi += flatRows[i].pcs || 0;
                      }
                      // Teori Stock & Rencana Stock (dummy, implementasi detail sesuai rumus user bisa ditambahkan)
                      // ...

                      // --- Teori Stock & Rencana Stock Custom ---
                      let teoriStockCustom = 0;
                      let rencanaStockCustom = 0;
                      const isHariPertama = groupIdx === 0 && row.shift === "1";
                      const isShift1 = row.shift === "1";
                      const isShift2 = row.shift === "2";
                      const prevDayGroup = groupedRows[groupIdx - 1];
                      const prevDayShift2 = prevDayGroup ? prevDayGroup.rows.find(r => r.shift === "2") : undefined;
                      const prevTeoriStockShift2 = prevDayShift2 ? prevDayShift2.teoriStockCustom ?? 0 : initialStock;
                      const prevRencanaStockShift2 = prevDayShift2 ? prevDayShift2.rencanaStockCustom ?? 0 : initialStock;
                      const hasilProduksiShift1 = isShift1 ? hasilProduksi : 0;
                      const hasilProduksiShift2 = isShift2 ? hasilProduksi : 0;
                      const planningPcs = row.planningPcs || 0;
                      const overtimePcs = row.overtimePcs || 0;
                      const delivery = row.delivery || 0;
                      if (isHariPertama) {
                        teoriStockCustom = initialStock + akumulasiHasilProduksi - akumulasiDeliveryShift1;
                        rencanaStockCustom = hasilProduksi === 0
                          ? initialStock + planningPcs + overtimePcs - delivery
                          : initialStock + hasilProduksi - delivery;
                      } else if (isShift1) {
                        teoriStockCustom = prevTeoriStockShift2 + hasilProduksiShift1 - delivery;
                        rencanaStockCustom = hasilProduksi === 0
                          ? prevRencanaStockShift2 + planningPcs + overtimePcs - delivery
                          : prevRencanaStockShift2 + hasilProduksiShift1 - delivery;
                      } else if (isShift2) {
                        // cari shift 1 di hari yang sama
                        const shift1Row = group.rows.find(r => r.shift === "1");
                        const shift1TeoriStock = shift1Row ? shift1Row.teoriStockCustom ?? 0 : 0;
                        const shift1RencanaStock = shift1Row ? shift1Row.rencanaStockCustom ?? 0 : 0;
                        teoriStockCustom = shift1TeoriStock + hasilProduksiShift2 - delivery;
                        rencanaStockCustom = hasilProduksi === 0
                          ? shift1RencanaStock + planningPcs + overtimePcs - delivery
                          : shift1RencanaStock + hasilProduksiShift2 - delivery;
                      }
                      // Simpan ke row agar bisa dipakai shift berikutnya
                      row.teoriStockCustom = teoriStockCustom;
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
                                    {row.time}
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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <DataCard
                                title="Stok Tersedia"
                                value={calculated.prevStock}
                                icon="📦"
                                className="bg-emerald-500/10 border-emerald-500/20"
                              />
                              {/* Delivery and Hasil Produksi moved to Input Parameter */}
                              <DataCard
                                title="Stock Akhir"
                                value={calculated.rencanaStock}
                                icon="�"
                                className="bg-cyan-500/10 border-cyan-500/20"
                              />
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="p-6 space-y-6">
                            {/* Tampilkan nilai input meski tidak sedang edit */}
                            <div className="space-y-2 mt-2">
                              <div className="text-blue-300 font-bold text-xs mb-1 pl-1">Input Parameter</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-blue-900/80 rounded-2xl p-3 border border-blue-400 flex flex-col items-center min-w-[110px] shadow-lg shadow-blue-400/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <span className="text-base">📝</span>
                                    <span className="text-blue-200/90 font-semibold text-xs">Planning (pcs)</span>
                                  </div>
                                  <input
                                    type="number"
                                    step={1}
                                    value={row.planningPcs ?? 0}
                                    onChange={e => {
                                      row.planningPcs = Number(e.target.value);
                                      setEditForm(prev => ({ ...prev, planningPcs: row.planningPcs }));
                                    }}
                                    className="mt-0.5 font-bold text-blue-100 text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                  />
                                </div>
                                <div className="bg-blue-900/80 rounded-2xl p-3 border border-blue-400 flex flex-col items-center min-w-[110px] shadow-lg shadow-blue-400/40 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <span className="text-base">🚚</span>
                                    <span className="text-blue-200/90 font-semibold text-xs">Delivery (pcs)</span>
                                  </div>
                                  <input
                                    type="number"
                                    step={1}
                                    value={row.delivery ?? 0}
                                    onChange={e => {
                                      row.delivery = Number(e.target.value);
                                      setEditForm(prev => ({ ...prev, delivery: row.delivery }));
                                    }}
                                    className="mt-0.5 font-bold text-blue-100 text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                  />
                                </div>
                                <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <span className="text-base">⏱️</span>
                                    <span className="text-blue-200/90 font-semibold text-xs">Overtime (pcs)</span>
                                  </div>
                                  <input
                                    type="number"
                                    step={1}
                                    value={row.overtimePcs ?? 0}
                                    onChange={e => {
                                      row.overtimePcs = Number(e.target.value);
                                      setEditForm(prev => ({ ...prev, overtimePcs: row.overtimePcs }));
                                    }}
                                    className="mt-0.5 font-bold text-blue-100 text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                  />
                                </div>
                                <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <span className="text-base">🏭</span>
                                    <span className="text-blue-200/90 font-semibold text-xs">Hasil Produksi (pcs)</span>
                                  </div>
                                  <input
                                    type="number"
                                    step={1}
                                    value={row.pcs ?? 0}
                                    onChange={e => {
                                      row.pcs = Number(e.target.value);
                                      setEditForm(prev => ({ ...prev, pcs: row.pcs }));
                                    }}
                                    className="mt-0.5 font-bold text-blue-100 text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                  />
                                </div>
                                <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30 w-full">
                                  <div className="flex items-center gap-1 mb-0.5 w-full">
                                    <span className="text-base">⏲️</span>
                                    <span className="text-blue-200/90 font-semibold text-xs">Jam Produksi Aktual</span>
                                  </div>
                                  <input
                                    type="number"
                                    step={0.1}
                                    value={row.jamProduksiAktual ?? 0}
                                    onChange={e => {
                                      row.jamProduksiAktual = Number(e.target.value);
                                      setEditForm(prev => ({ ...prev, jamProduksiAktual: row.jamProduksiAktual }));
                                    }}
                                    className="mt-0.5 font-bold text-blue-100 text-lg bg-transparent border-none text-center w-full focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                            {/* Output Section: Custom Output sesuai rumus user */}
                            <div className="space-y-2 mt-2">
                              <div className="text-blue-300 font-bold text-xs mb-1 pl-1">Output Parameter</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Akumulasi Delivery hanya tampil di shift yang sesuai */}
                                {row.shift === "1" && (
                                  <div className="bg-blue-900/80 rounded-2xl p-3 border border-blue-400 flex flex-col items-center min-w-[110px] shadow-lg shadow-blue-400/40">
                                    <div className="flex items-center gap-1 mb-0.5">
                                      <span className="text-base">🚚</span>
                                      <span className="font-semibold text-xs text-blue-200/90">Akumulasi Delivery Shift 1</span>
                                    </div>
                                    <span className="font-bold text-blue-100 text-lg mt-0.5">{akumulasiDeliveryShift1}</span>
                                  </div>
                                )}
                                {row.shift === "2" && (
                                  <div className="bg-blue-900/80 rounded-2xl p-3 border border-blue-400 flex flex-col items-center min-w-[110px] shadow-lg shadow-blue-400/40">
                                    <div className="flex items-center gap-1 mb-0.5">
                                      <span className="text-base">🚚</span>
                                      <span className="font-semibold text-xs text-blue-200/90">Akumulasi Delivery Shift 2</span>
                                    </div>
                                    <span className="font-bold text-blue-100 text-lg mt-0.5">{akumulasiDeliveryShift2}</span>
                                  </div>
                                )}
                                <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30">
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <span className="text-base">�</span>
                                    <span className="font-semibold text-xs text-blue-200/90">Planning (jam)</span>
                                  </div>
                                  <span className="font-bold text-blue-100 text-lg mt-0.5">{planningJam}</span>
                                </div>
                                <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30">
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <span className="text-base">⏱️</span>
                                    <span className="font-semibold text-xs text-blue-200/90">Overtime (jam)</span>
                                  </div>
                                  <span className="font-bold text-blue-100 text-lg mt-0.5">{overtimeJam}</span>
                                </div>
                                <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30">
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <span className="text-base">⏲️</span>
                                    <span className="font-semibold text-xs text-blue-200/90">Jam Produksi (Cycle Time)</span>
                                  </div>
                                  <span className="font-bold text-blue-100 text-lg mt-0.5">{jamProduksi}</span>
                                </div>
                                <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30">
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <span className="text-base">🏭</span>
                                    <span className="font-semibold text-xs text-blue-200/90">Akumulasi Hasil Produksi</span>
                                  </div>
                                  <span className="font-bold text-blue-100 text-lg mt-0.5">{akumulasiHasilProduksi}</span>
                                </div>
                                <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30">
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <span className="text-base">🧮</span>
                                    <span className="font-semibold text-xs text-blue-200/90">Teori Stock</span>
                                  </div>
                                  <span className="font-bold text-blue-100 text-lg mt-0.5">{teoriStockCustom}</span>
                                </div>
                                <div className="bg-blue-950/80 rounded-2xl p-3 border border-blue-700 flex flex-col items-center min-w-[110px] shadow shadow-blue-900/30">
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <span className="text-base">�</span>
                                    <span className="font-semibold text-xs text-blue-200/90">Rencana Stock</span>
                                  </div>
                                  <span className="font-bold text-blue-100 text-lg mt-0.5">{rencanaStockCustom}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Timeline View */
          <div className="space-y-6">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-cyan-500"></div>

              {groupedRows.map((group, groupIdx) => {
                let flatIdx = groupedRows
                  .slice(0, groupIdx)
                  .reduce((sum, g) => sum + g.rows.length, 0);

                return (
                  <div key={group.day} className="relative">
                    {/* Day Marker */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg z-10">
                        {group.day}
                      </div>
                      <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700/50 flex-1">
                        <h3 className="text-xl font-bold text-white">
                          {group.day} Juli 2024
                        </h3>
                        <p className="text-slate-400">
                          {group.rows.length} shift produksi
                        </p>
                      </div>
                    </div>

                    {/* Shifts */}
                    <div className="ml-20 space-y-4 mb-8">
                      {group.rows.map((row) => {
                        const calculated = calculateOutputFields(
                          row,
                          flatIdx,
                          flatRows,
                        );
                        const validationAlerts = checkValidation(
                          row,
                          calculated,
                        );
                        flatIdx++;

                        return (
                          <div
                            key={row.id}
                            className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50 hover:bg-slate-800/80 transition-all"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                  {row.shift}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-white">
                                    Shift {row.shift}
                                  </h4>
                                  <p className="text-slate-400 text-sm">
                                    {row.time}
                                  </p>
                                </div>
                              </div>
                              <StatusBadge status={row.status} />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="text-center p-2 bg-slate-900/50 rounded">
                                <div className="text-xs text-slate-400">
                                  Stok Awal
                                </div>
                                <div className="font-mono font-semibold text-emerald-300">
                                  {calculated.prevStock.toLocaleString()}
                                </div>
                              </div>
                              <div className="text-center p-2 bg-slate-900/50 rounded">
                                <div className="text-xs text-slate-400">
                                  Delivery
                                </div>
                                <div className="font-mono font-semibold text-blue-300">
                                  {(row.delivery || 0).toLocaleString()}
                                </div>
                              </div>
                              <div className="text-center p-2 bg-slate-900/50 rounded">
                                <div className="text-xs text-slate-400">
                                  Produksi
                                </div>
                                <div className="font-mono font-semibold text-purple-300">
                                  {calculated.hasilProduksi.toLocaleString()}
                                </div>
                              </div>
                              <div className="text-center p-2 bg-slate-900/50 rounded">
                                <div className="text-xs text-slate-400">
                                  Stock Akhir
                                </div>
                                <div className="font-mono font-semibold text-cyan-300">
                                  {calculated.rencanaStock.toLocaleString()}
                                </div>
                              </div>
                            </div>

                            {validationAlerts.length > 0 && (
                              <div className="mt-3 p-2 bg-amber-900/20 border border-amber-600/30 rounded text-xs text-amber-300">
                                ⚠️ {validationAlerts[0]}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Footer */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 border-t border-slate-600/50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
            <span>
              📊 Total Data:{" "}
              <strong className="text-white">{filteredSchedule.length}</strong>
            </span>
            <span>
              🏭 Time per PCS:{" "}
              <strong className="text-white">{timePerPcs}s</strong>
            </span>
            <span>
              📦 Initial Stock:{" "}
              <strong className="text-white">
                {initialStock.toLocaleString()}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className="text-slate-400">Normal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-slate-400">Gangguan</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-slate-400">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCards;
