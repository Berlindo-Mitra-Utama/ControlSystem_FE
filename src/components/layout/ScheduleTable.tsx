import React from "react";

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
}

interface ScheduleTableProps {
  schedule: ScheduleItem[];
  editingRow: string | null;
  editForm: Partial<ScheduleItem>;
  startEdit: (item: ScheduleItem) => void;
  saveEdit: (itemId: string) => void;
  cancelEdit: () => void;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<ScheduleItem>>>;
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({
  schedule,
  editingRow,
  editForm,
  startEdit,
  saveEdit,
  cancelEdit,
  setEditForm,
}) => {
  return (
    <div className="overflow-x-auto max-h-[400px] relative">
      <table className="w-full">
        <thead className="sticky top-0 z-10 bg-gray-900">
          <tr className="border-b border-gray-800">
            <th className="text-left py-4 px-4 font-semibold text-gray-300 text-sm">No</th>
            <th className="text-left py-4 px-4 font-semibold text-gray-300 text-sm">Tanggal</th>
            <th className="text-left py-4 px-4 font-semibold text-gray-300 text-sm">Shift</th>
            <th className="text-left py-4 px-4 font-semibold text-gray-300 text-sm">Tipe</th>
            <th className="text-left py-4 px-4 font-semibold text-gray-300 text-sm">Status</th>
            <th className="text-right py-4 px-4 font-semibold text-gray-300 text-sm">Target (PCS)</th>
            <th className="text-right py-4 px-4 font-semibold text-gray-300 text-sm">Actual (PCS)</th>
            <th className="text-right py-4 px-4 font-semibold text-gray-300 text-sm">Time (Min)</th>
            <th className="text-left py-4 px-4 font-semibold text-gray-300 text-sm">Catatan</th>
            <th className="text-center py-4 px-4 font-semibold text-gray-300 text-sm">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row, idx) => (
            <tr
              key={row.id}
              className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors duration-200"
            >
              <td className="py-4 px-4 font-medium text-white">{idx + 1}</td>
              <td className="py-4 px-4 text-gray-300">{`${row.day} Juli 2024`}</td>
              <td className="py-4 px-4">
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  Shift {row.shift}
                </span>
              </td>
              <td className="py-4 px-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
                    row.type.includes("Lembur")
                      ? "bg-gradient-to-r from-orange-500 to-red-600 text-white"
                      : "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                  }`}
                >
                  {row.type}
                </span>
              </td>
              <td className="py-4 px-4">
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
              <td className="py-4 px-4 text-right font-semibold text-white">
                {row.pcs.toLocaleString()}
              </td>
              <td className="py-4 px-4 text-right">
                {editingRow === row.id ? (
                  <input
                    type="number"
                    value={
                      editForm.actualPcs !== undefined
                        ? editForm.actualPcs
                        : row.actualPcs
                    }
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        actualPcs: Number.parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <span
                    className={`font-semibold ${
                      row.status === "Gangguan" &&
                      (row.actualPcs || 0) < row.pcs
                        ? "text-red-400"
                        : "text-white"
                    }`}
                  >
                    {(row.actualPcs || row.pcs).toLocaleString()}
                  </span>
                )}
              </td>
              <td className="py-4 px-4 text-right text-gray-300">
                {row.time}
              </td>
              <td className="py-4 px-4 text-sm">
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
              <td className="py-4 px-4 text-center">
                {editingRow === row.id ? (
                  <div className="flex items-center gap-2">
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
                  </div>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTable;
