import React, { useState } from "react";

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
  delivery?: number; // jumlah permintaan customer per hari
  // Kolom hasil perhitungan planning produksi:
  planningPcs?: number;
  overtimePcs?: number;
  sisaPlanningPcs?: number;
  sisaStock?: number;
  selisih?: number; // selisih planning pcs jika diedit, hanya untuk tampilan

  // Input fields baru
  planningHour?: number; // jam kerja normal yang direncanakan
  overtimeHour?: number; // durasi lembur yang diizinkan
  jamProduksiAktual?: number; // jam produksi aktual (optional)

  // Output fields baru
  akumulasiDelivery?: number; // penjumlahan delivery dari hari sebelumnya
  hasilProduksi?: number; // jumlah PCS yang dihasilkan sesuai waktu tersedia
  akumulasiHasilProduksi?: number; // total PCS kumulatif dari hasil sebelumnya
  jamProduksiCycleTime?: number; // HasilProduksi × TimePerPcs ÷ 3600
  selisihDetikPerPcs?: number; // TargetDetik/PCS – AktualDetik/PCS
  selisihCycleTime?: number; // perbandingan waktu rencana vs aktual
  selisihCycleTimePcs?: number; // selisih jumlah PCS berdasarkan perbedaan waktu
  teoriStock?: number; // stok teoritis jika produksi berjalan sesuai rencana
  rencanaStock?: number; // Stock + HasilProduksi – Delivery
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
  timePerPcs?: number; // tambahkan prop untuk perhitungan
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({
  schedule,
  editingRow,
  editForm,
  startEdit,
  saveEdit,
  cancelEdit,
  setEditForm,
  initialStock,
  timePerPcs = 257, // default value
}) => {
  // State for search box
  const [searchDate, setSearchDate] = useState("");
  const [alerts, setAlerts] = useState<{ [key: string]: string }>({});

  // Filter schedule by date (day as string, e.g. "8" for 8 Juli 2024)
  const filteredSchedule = searchDate
    ? schedule.filter((row) => row.day.toString().includes(searchDate.trim()))
    : schedule;

  // Group rows by day for merging "No" column
  const groupedRows: { day: number; rows: typeof filteredSchedule }[] = [];
  filteredSchedule.forEach((row) => {
    const lastGroup = groupedRows[groupedRows.length - 1];
    if (lastGroup && lastGroup.day === row.day) {
      lastGroup.rows.push(row);
    } else {
      groupedRows.push({ day: row.day, rows: [row] });
    }
  });

  // Fungsi untuk menghitung output fields
  const calculateOutputFields = (
    row: ScheduleItem,
    index: number,
    allRows: ScheduleItem[],
  ) => {
    const planningHour = row.planningHour || 0;
    const overtimeHour = row.overtimeHour || 0;
    const delivery = row.delivery || 0;

    // 1. Akumulasi Delivery (PCS)
    const akumulasiDelivery = allRows
      .slice(0, index)
      .reduce((sum, r) => sum + (r.delivery || 0), 0);

    // 2. Planning PCS: PlanningHour × 3600 ÷ TimePerPcs
    const planningPcs =
      planningHour > 0 ? Math.floor((planningHour * 3600) / timePerPcs) : 0;

    // 3. Overtime PCS: OvertimeHour × 3600 ÷ TimePerPcs
    const overtimePcs =
      overtimeHour > 0 ? Math.floor((overtimeHour * 3600) / timePerPcs) : 0;

    // 4. Hasil Produksi (PCS): Jumlah PCS yang dihasilkan sesuai waktu tersedia
    const hasilProduksi = planningPcs + overtimePcs;

    // 5. Akumulasi Hasil Produksi (PCS)
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

    // 6. Jam Produksi (Cycle Time): HasilProduksi × TimePerPcs ÷ 3600
    const jamProduksiCycleTime =
      hasilProduksi > 0 ? (hasilProduksi * timePerPcs) / 3600 : 0;

    // 7. Selisih Detik/PCS (memerlukan data aktual)
    const selisihDetikPerPcs =
      row.jamProduksiAktual && hasilProduksi > 0
        ? timePerPcs - (row.jamProduksiAktual * 3600) / hasilProduksi
        : 0;

    // 8. Selisih Cycle Time
    const selisihCycleTime = row.jamProduksiAktual
      ? jamProduksiCycleTime - row.jamProduksiAktual
      : 0;

    // 9. Selisih Cycle Time (PCS)
    const selisihCycleTimePcs =
      selisihCycleTime > 0
        ? Math.floor((selisihCycleTime * 3600) / timePerPcs)
        : 0;

    // 10. Teori Stock (PCS): Stok teoritis jika produksi berjalan sesuai rencana
    const prevStock =
      index === 0
        ? initialStock
        : allRows[index - 1].rencanaStock || initialStock;
    const teoriStock = prevStock + hasilProduksi;

    // 11. Rencana Stock (PCS): Stock + HasilProduksi – Delivery
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
    };
  };

  // Validasi dan alert
  const checkValidation = (row: ScheduleItem, calculated: any) => {
    const alerts: string[] = [];

    // Validasi 1: Jika stock >= delivery
    if (
      calculated.rencanaStock >= (row.delivery || 0) &&
      (row.delivery || 0) > 0
    ) {
      alerts.push("Stok sudah cukup, tidak perlu produksi.");
    }

    // Validasi 2: Jika waktu produksi tidak cukup
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

  // --- STOCK CALCULATION LOGIC (KOREKSI: stock = stock sebelumnya + produksi - delivery) ---
  const flatRows: ScheduleItem[] = groupedRows.flatMap((g) => g.rows);
  const stockArr = flatRows.reduce<{
    stokTersedia: number[];
    stockSaatIni: number[];
  }>(
    (acc, row, idx) => {
      const calculated = calculateOutputFields(row, idx, flatRows);

      if (idx === 0) {
        acc.stokTersedia[0] = initialStock;
        acc.stockSaatIni[0] = calculated.rencanaStock;
      } else {
        acc.stokTersedia[idx] = acc.stockSaatIni[idx - 1];
        acc.stockSaatIni[idx] = calculated.rencanaStock;
      }
      return acc;
    },
    { stokTersedia: [], stockSaatIni: [] },
  );

  let rowIndex = 0;

  return (
    // Perbaikan untuk container tabel
    <div className="overflow-x-auto max-h-[600px] relative w-full bg-gray-900 rounded-lg border border-gray-700">
      {/* Sticky search box */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-gray-900 to-gray-800 p-4 border-b border-gray-700 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-400"
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
          <input
            type="text"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            placeholder="Cari tanggal produksi..."
            className="w-full max-w-sm px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all duration-200"
          />
          {searchDate && (
            <button
              onClick={() => setSearchDate("")}
              className="text-red-400 hover:text-red-300 text-sm px-3 py-2 rounded-lg border border-gray-600 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-200"
              type="button"
            >
              ✕ Hapus
            </button>
          )}
        </div>
      </div>

      {/* Table wrapper dengan shadow dan border yang lebih baik */}
      <div className="relative w-full min-w-max shadow-xl">
        <table
          className="w-full border-collapse min-w-max bg-gray-900"
          style={{ tableLayout: "auto" }}
        >
          <thead
            className="sticky top-[72px] z-30 bg-gradient-to-r from-gray-800 to-gray-700"
            style={{
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            }}
          >
            {/* Header dengan grouping yang lebih jelas */}
            <tr className="border-b-2 border-gray-600">
              {/* Basic Info Group */}
              <th
                colSpan={4}
                className="bg-blue-900/30 text-center py-2 px-3 font-bold text-blue-200 text-xs border-r border-gray-600"
              >
                📋 INFORMASI DASAR
              </th>
              {/* Stock Group */}
              <th
                colSpan={3}
                className="bg-green-900/30 text-center py-2 px-3 font-bold text-green-200 text-xs border-r border-gray-600"
              >
                📦 STOK & DELIVERY
              </th>
              {/* Input Group */}
              <th
                colSpan={3}
                className="bg-orange-900/30 text-center py-2 px-3 font-bold text-orange-200 text-xs border-r border-gray-600"
              >
                ⏰ INPUT JAM KERJA
              </th>
              {/* Production Output Group */}
              <th
                colSpan={5}
                className="bg-purple-900/30 text-center py-2 px-3 font-bold text-purple-200 text-xs border-r border-gray-600"
              >
                🏭 HASIL PRODUKSI
              </th>
              {/* Analysis Group */}
              <th
                colSpan={4}
                className="bg-indigo-900/30 text-center py-2 px-3 font-bold text-indigo-200 text-xs border-r border-gray-600"
              >
                📊 ANALISIS CYCLE TIME
              </th>
              {/* Stock Planning Group */}
              <th
                colSpan={2}
                className="bg-cyan-900/30 text-center py-2 px-3 font-bold text-cyan-200 text-xs border-r border-gray-600"
              >
                📈 PERENCANAAN STOK
              </th>
              {/* Actions Group */}
              <th
                colSpan={2}
                className="bg-gray-700 text-center py-2 px-3 font-bold text-gray-200 text-xs"
              >
                ⚙️ AKSI
              </th>
            </tr>

            {/* Sub headers dengan styling yang lebih baik */}
            <tr className="border-b border-gray-600">
              {/* Basic Info */}
              <th className="sticky top-0 left-0 bg-gray-800 text-center py-4 px-3 font-semibold text-gray-200 text-sm z-30 min-w-[60px] border-r border-gray-600">
                No
              </th>
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-gray-200 text-sm z-30 min-w-[120px] border-r border-gray-600">
                📅 Tanggal
              </th>
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-gray-200 text-sm z-30 min-w-[80px] border-r border-gray-600">
                🔄 Shift
              </th>
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-gray-200 text-sm z-30 min-w-[100px] border-r border-gray-600">
                🚦 Status
              </th>

              {/* Stock & Delivery */}
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-green-200 text-sm z-30 min-w-[130px] border-r border-gray-600">
                📦 Stok Tersedia
              </th>
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-green-200 text-sm z-30 min-w-[130px] border-r border-gray-600">
                📊 Stock Saat Ini
              </th>
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-green-200 text-sm z-30 min-w-[110px] border-r border-gray-600">
                🚚 Delivery
              </th>

              {/* Input Fields */}
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-orange-200 text-sm z-30 min-w-[130px] border-r border-gray-600">
                ⏰ Planning Hour
              </th>
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-orange-200 text-sm z-30 min-w-[130px] border-r border-gray-600">
                ⏱️ Overtime Hour
              </th>
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-orange-200 text-sm z-30 min-w-[150px] border-r border-gray-600">
                🕐 Jam Produksi Aktual
              </th>

              {/* Production Output */}
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-purple-200 text-sm z-30 min-w-[150px] border-r border-gray-600">
                📈 Akumulasi Delivery
              </th>
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-purple-200 text-sm z-30 min-w-[130px] border-r border-gray-600">
                🎯 Planning PCS
              </th>
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-purple-200 text-sm z-30 min-w-[130px] border-r border-gray-600">
                ⚡ Overtime PCS
              </th>
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-purple-200 text-sm z-30 min-w-[130px] border-r border-gray-600">
                🏭 Hasil Produksi
              </th>
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-purple-200 text-sm z-30 min-w-[170px] border-r border-gray-600">
                📊 Akumulasi Hasil
              </th>

              {/* Analysis */}
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-indigo-200 text-sm z-30 min-w-[170px] border-r border-gray-600">
                ⏲️ Jam Produksi (CT)
              </th>
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-indigo-200 text-sm z-30 min-w-[150px] border-r border-gray-600">
                📏 Selisih Detik/PCS
              </th>
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-indigo-200 text-sm z-30 min-w-[150px] border-r border-gray-600">
                📐 Selisih Cycle Time
              </th>
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-indigo-200 text-sm z-30 min-w-[170px] border-r border-gray-600">
                📊 Selisih CT (PCS)
              </th>

              {/* Stock Planning */}
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-cyan-200 text-sm z-30 min-w-[130px] border-r border-gray-600">
                🧮 Teori Stock
              </th>
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-cyan-200 text-sm z-30 min-w-[130px] border-r border-gray-600">
                📋 Rencana Stock
              </th>

              {/* Actions */}
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-gray-200 text-sm z-30 min-w-[130px] border-r border-gray-600">
                📝 Catatan
              </th>
              <th className="sticky top-0 bg-gray-800 text-center py-4 px-3 font-semibold text-gray-200 text-sm z-30 min-w-[110px]">
                ⚙️ Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let flatIdx = 0;
              let rowIndex = 0;
              return groupedRows.map((group, groupIdx) =>
                group.rows.map((row, idx) => {
                  const isFirst = idx === 0;
                  const rowSpan = isFirst ? group.rows.length : undefined;
                  rowIndex++;

                  // Calculate output fields
                  const calculated = calculateOutputFields(
                    row,
                    flatIdx,
                    flatRows,
                  );

                  // Check validations
                  const validationAlerts = checkValidation(row, calculated);

                  // Use precomputed stock values
                  const stokTersedia = stockArr.stokTersedia[flatIdx];
                  const stockSaatIni = stockArr.stockSaatIni[flatIdx];
                  flatIdx++;

                  return (
                    // Perbaikan styling untuk baris tabel
                    <tr
                      key={row.id}
                      className={`border-b border-gray-700/50 hover:bg-gray-800/40 transition-all duration-300 text-sm ${
                        validationAlerts.length > 0
                          ? "bg-yellow-900/20 border-yellow-600/30"
                          : ""
                      } ${
                        row.shift === "1"
                          ? "bg-blue-900/10"
                          : "bg-indigo-900/10"
                      }`}
                    >
                      {isFirst && (
                        <td
                          className="py-3 px-2 font-medium text-white text-center align-middle"
                          rowSpan={rowSpan}
                          style={{
                            verticalAlign:
                              rowSpan && rowSpan > 1 ? "middle" : undefined,
                          }}
                        >
                          {groupIdx + 1}
                        </td>
                      )}
                      {isFirst && (
                        <td
                          className="py-3 px-2 text-gray-300 text-center align-middle"
                          rowSpan={rowSpan}
                          style={{
                            verticalAlign:
                              rowSpan && rowSpan > 1 ? "middle" : undefined,
                          }}
                        >
                          {`${row.day} Juli 2024`}
                        </td>
                      )}
                      <td className="py-3 px-2 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                          Shift {row.shift}
                          {typeof row.selisih === "number" &&
                            row.selisih !== 0 && (
                              <span
                                className={
                                  row.selisih > 0
                                    ? "ml-2 text-green-400 font-bold"
                                    : "ml-2 text-red-400 font-bold"
                                }
                              >
                                {row.selisih > 0
                                  ? `+${row.selisih}`
                                  : row.selisih}
                              </span>
                            )}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {editingRow === row.id ? (
                          <select
                            value={editForm.status || row.status}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                status: e.target.value as any,
                              }))
                            }
                            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Normal">Normal</option>
                            <option value="Gangguan">Gangguan</option>
                            <option value="Completed">Completed</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
                              row.status === "Normal"
                                ? "bg-green-100 text-green-800"
                                : row.status === "Gangguan"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {row.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right font-semibold text-white">
                        {stokTersedia.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right font-semibold text-white">
                        {stockSaatIni.toLocaleString()}
                      </td>
                      {/* Delivery input hanya di shift 1, shift 2 hanya tampil */}
                      <td className="py-3 px-2 text-right font-semibold text-white">
                        {row.shift === "1" ? (
                          editingRow === row.id ? (
                            <input
                              type="number"
                              value={
                                editForm.delivery !== undefined
                                  ? editForm.delivery
                                  : (row.delivery ?? "")
                              }
                              onChange={(e) => {
                                const value =
                                  Number.parseInt(e.target.value) || 0;
                                setEditForm((prev) => ({
                                  ...prev,
                                  delivery: value,
                                }));
                              }}
                              className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="font-semibold text-white">
                              {row.delivery !== undefined
                                ? row.delivery.toLocaleString()
                                : "-"}
                            </span>
                          )
                        ) : (
                          <span className="font-semibold text-white">-</span>
                        )}
                      </td>

                      {/* INPUT FIELDS */}
                      {/* Planning Hour */}
                      <td className="py-3 px-2 text-right font-semibold text-green-200">
                        {editingRow === row.id ? (
                          <input
                            type="number"
                            step="0.1"
                            value={
                              editForm.planningHour !== undefined
                                ? editForm.planningHour
                                : (row.planningHour ?? "")
                            }
                            onChange={(e) => {
                              const value =
                                Number.parseFloat(e.target.value) || 0;
                              setEditForm((prev) => ({
                                ...prev,
                                planningHour: value,
                              }));
                            }}
                            className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="7"
                          />
                        ) : (
                          <span className="font-semibold text-green-200">
                            {row.planningHour !== undefined
                              ? row.planningHour.toFixed(1)
                              : "-"}
                          </span>
                        )}
                      </td>

                      {/* Overtime Hour */}
                      <td className="py-3 px-2 text-right font-semibold text-orange-200">
                        {editingRow === row.id ? (
                          <input
                            type="number"
                            step="0.1"
                            value={
                              editForm.overtimeHour !== undefined
                                ? editForm.overtimeHour
                                : (row.overtimeHour ?? "")
                            }
                            onChange={(e) => {
                              const value =
                                Number.parseFloat(e.target.value) || 0;
                              setEditForm((prev) => ({
                                ...prev,
                                overtimeHour: value,
                              }));
                            }}
                            className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="3.5"
                          />
                        ) : (
                          <span className="font-semibold text-orange-200">
                            {row.overtimeHour !== undefined
                              ? row.overtimeHour.toFixed(1)
                              : "-"}
                          </span>
                        )}
                      </td>

                      {/* Jam Produksi Aktual */}
                      <td className="py-3 px-2 text-right font-semibold text-purple-200">
                        {editingRow === row.id ? (
                          <input
                            type="number"
                            step="0.1"
                            value={
                              editForm.jamProduksiAktual !== undefined
                                ? editForm.jamProduksiAktual
                                : (row.jamProduksiAktual ?? "")
                            }
                            onChange={(e) => {
                              const value =
                                Number.parseFloat(e.target.value) || 0;
                              setEditForm((prev) => ({
                                ...prev,
                                jamProduksiAktual: value,
                              }));
                            }}
                            className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Optional"
                          />
                        ) : (
                          <span className="font-semibold text-purple-200">
                            {row.jamProduksiAktual !== undefined
                              ? row.jamProduksiAktual.toFixed(1)
                              : "-"}
                          </span>
                        )}
                      </td>

                      {/* OUTPUT FIELDS */}
                      {/* Akumulasi Delivery */}
                      <td className="py-3 px-2 text-right font-semibold text-yellow-200">
                        {calculated.akumulasiDelivery.toLocaleString()}
                      </td>

                      {/* Planning PCS */}
                      <td className="py-3 px-2 text-right font-semibold text-blue-200">
                        {calculated.planningPcs.toLocaleString()}
                      </td>

                      {/* Overtime PCS */}
                      <td className="py-3 px-2 text-right font-semibold text-orange-300">
                        {calculated.overtimePcs.toLocaleString()}
                      </td>

                      {/* Hasil Produksi */}
                      <td className="py-3 px-2 text-right font-semibold text-green-300">
                        {calculated.hasilProduksi.toLocaleString()}
                      </td>

                      {/* Akumulasi Hasil Produksi */}
                      <td className="py-3 px-2 text-right font-semibold text-cyan-200">
                        {calculated.akumulasiHasilProduksi.toLocaleString()}
                      </td>

                      {/* Jam Produksi (Cycle Time) */}
                      <td className="py-3 px-2 text-right font-semibold text-indigo-200">
                        {calculated.jamProduksiCycleTime.toFixed(2)}
                      </td>

                      {/* Selisih Detik/PCS */}
                      <td className="py-3 px-2 text-right font-semibold text-pink-200">
                        {calculated.selisihDetikPerPcs.toFixed(2)}
                      </td>

                      {/* Selisih Cycle Time */}
                      <td className="py-3 px-2 text-right font-semibold text-red-200">
                        {calculated.selisihCycleTime.toFixed(2)}
                      </td>

                      {/* Selisih Cycle Time (PCS) */}
                      <td className="py-3 px-2 text-right font-semibold text-amber-200">
                        {calculated.selisihCycleTimePcs.toLocaleString()}
                      </td>

                      {/* Teori Stock */}
                      <td className="py-3 px-2 text-right font-semibold text-lime-200">
                        {calculated.teoriStock.toLocaleString()}
                      </td>

                      {/* Rencana Stock */}
                      <td className="py-3 px-2 text-right font-semibold text-emerald-200">
                        {calculated.rencanaStock.toLocaleString()}
                      </td>

                      {/* Catatan dengan validasi alert */}
                      <td className="py-3 px-2 text-sm">
                        {editingRow === row.id ? (
                          <input
                            type="text"
                            value={
                              editForm.notes !== undefined
                                ? editForm.notes
                                : row.notes
                            }
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                            placeholder="Add notes..."
                            className="w-32 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <div>
                            <span className="text-gray-400">
                              {row.notes || "-"}
                            </span>
                            {validationAlerts.length > 0 && (
                              <div className="mt-1">
                                {validationAlerts.map((alert, i) => (
                                  <div
                                    key={i}
                                    className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded mb-1"
                                  >
                                    ⚠️ {alert}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-2 text-center align-middle">
                        <div
                          className="flex items-center gap-2 justify-center"
                          style={{ minHeight: 40 }}
                        >
                          {editingRow === row.id ? (
                            <>
                              <button
                                onClick={() => saveEdit(row.id)}
                                className="text-green-400 hover:text-green-300 transition-colors duration-200"
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
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-red-400 hover:text-red-300 transition-colors duration-200"
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
                            </>
                          ) : (
                            <button
                              onClick={() => startEdit(row)}
                              className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }),
              );
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleTable;
