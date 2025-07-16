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
}

interface ScheduleTableProps {
  schedule: ScheduleItem[];
  editingRow: string | null;
  editForm: Partial<ScheduleItem>;
  startEdit: (item: ScheduleItem) => void;
  saveEdit: (itemId: string) => void;
  cancelEdit: () => void;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<ScheduleItem>>>;
  initialStock: number; // <-- add this prop
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
}) => {
  // State for search box
  const [searchDate, setSearchDate] = useState("");

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

  // --- STOCK CALCULATION LOGIC (KOREKSI: stock = stock sebelumnya + produksi - delivery) ---
  const flatRows: ScheduleItem[] = groupedRows.flatMap((g) => g.rows);
  const stockArr = flatRows.reduce<{
    stokTersedia: number[];
    stockSaatIni: number[];
  }>(
    (acc, row, idx) => {
      if (idx === 0) {
        acc.stokTersedia[0] = initialStock;
        acc.stockSaatIni[0] =
          initialStock + (row.planningPcs || 0) - (row.delivery || 0);
      } else {
        acc.stokTersedia[idx] = acc.stockSaatIni[idx - 1];
        acc.stockSaatIni[idx] =
          acc.stokTersedia[idx] + (row.planningPcs || 0) - (row.delivery || 0);
      }
      return acc;
    },
    { stokTersedia: [], stockSaatIni: [] },
  );

  let rowIndex = 0;

  return (
    <div className="overflow-x-auto max-h-[400px] relative">
      {/* Sticky search box below save button */}
      <div
        className="sticky top-0 z-20 bg-gray-900 pb-2 flex items-center gap-2"
        style={{
          boxShadow: "0 2px 4px 0 rgba(0,0,0,0.04)",
          marginLeft: "0.3cm",
        }}
      >
        <input
          type="text"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          placeholder="Cari tanggal produksi..."
          className="w-full max-w-xs px-4 py-2 rounded-lg border border-gray-600 bg-[#19202a] text-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition-colors duration-200"
          style={{ boxShadow: "0 0 0 1px #232b38" }}
        />
        {searchDate && (
          <button
            onClick={() => setSearchDate("")}
            className="text-red-400 text-base px-3 py-1 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors duration-200"
            type="button"
          >
            Hapus
          </button>
        )}
      </div>
      <div className="relative w-full">
        <table
          className="w-full border-collapse"
          style={{ tableLayout: "fixed" }}
        >
          <thead
            className="sticky top-[48px] z-30 bg-gray-900"
            style={{
              boxShadow: "0 2px 4px 0 rgba(0,0,0,0.04)",
              width: "100%",
            }}
          >
            <tr className="border-b border-gray-800 w-full">
              <th className="sticky top-0 left-0 bg-gray-900 text-center py-3 px-2 font-semibold text-gray-300 text-base z-30">
                No
              </th>
              <th className="sticky top-0 bg-gray-900 text-center py-3 px-2 font-semibold text-gray-300 text-base z-30">
                Tanggal
              </th>
              <th className="sticky top-0 bg-gray-900 text-center py-3 px-2 font-semibold text-gray-300 text-base z-30">
                Shift
              </th>
              {/* <th className="sticky top-0 bg-gray-900 text-center py-3 px-2 font-semibold text-gray-300 text-base z-30">Tipe</th> */}
              <th className="sticky top-0 bg-gray-900 text-center py-3 px-2 font-semibold text-gray-300 text-base z-30">
                Status
              </th>
              <th className="sticky top-0 bg-gray-900 text-center py-3 px-2 font-semibold text-gray-300 text-base z-30">
                Stok Tersedia
              </th>
              <th className="sticky top-0 bg-gray-900 text-center py-3 px-2 font-semibold text-gray-300 text-base z-30">
                Stock Saat Ini
              </th>
              <th className="sticky top-0 bg-gray-900 text-center py-3 px-2 font-semibold text-gray-300 text-base z-30">
                Delivery
              </th>
              <th className="sticky top-0 bg-gray-900 text-center py-3 px-2 font-semibold text-gray-300 text-base z-30">
                Planning PCS
              </th>
              <th className="sticky top-0 bg-gray-900 text-center py-3 px-2 font-semibold text-gray-300 text-base z-30">
                Overtime PCS
              </th>
              {/* <th className="sticky top-0 bg-gray-900 text-center py-3 px-2 font-semibold text-gray-300 text-base z-30">Sisa Planning PCS</th> */}
              {/* <th className="sticky top-0 bg-gray-900 text-center py-3 px-2 font-semibold text-gray-300 text-base z-30">Sisa Stock</th> */}
              <th className="sticky top-0 bg-gray-900 text-center py-3 px-2 font-semibold text-gray-300 text-base z-30">
                Catatan
              </th>
              <th className="sticky top-0 bg-gray-900 text-center py-3 px-2 font-semibold text-gray-300 text-base z-30">
                Aksi
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
                  // Use precomputed stock values
                  const stokTersedia = stockArr.stokTersedia[flatIdx];
                  const stockSaatIni = stockArr.stockSaatIni[flatIdx];
                  flatIdx++;
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors duration-200 text-base"
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
                      {/* <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
                            row.type.includes("Lembur")
                              ? "bg-gradient-to-r from-orange-500 to-red-600 text-white"
                              : "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                          }`}
                        >
                          {row.type}
                        </span>
                      </td> */}
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
                      {/* Planning PCS (editable on production day) */}
                      <td className="py-3 px-2 text-right font-semibold text-blue-200">
                        {editingRow === row.id ? (
                          <input
                            type="number"
                            value={
                              editForm.planningPcs !== undefined
                                ? editForm.planningPcs
                                : (row.planningPcs ?? 0)
                            }
                            min={0}
                            className="w-20 px-2 py-1 rounded bg-gray-700 text-white border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                planningPcs: Number(e.target.value),
                              }))
                            }
                          />
                        ) : row.planningPcs !== undefined ? (
                          row.planningPcs.toLocaleString()
                        ) : (
                          "-"
                        )}
                      </td>
                      {/* Overtime PCS */}
                      <td className="py-3 px-2 text-right font-semibold text-orange-300">
                        {row.overtimePcs !== undefined
                          ? row.overtimePcs.toLocaleString()
                          : "-"}
                      </td>
                      {/* Sisa Planning PCS (Shortfall) and Sisa Stock removed as requested */}
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
                          <span className="text-gray-400">
                            {row.notes || "-"}
                          </span>
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
