import React, { useState } from "react";
import { useSchedule } from "../contexts/ScheduleContext";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

const SavedSchedulesPage: React.FC = () => {
  const navigate = useNavigate();
  const { savedSchedules, loadSchedule, deleteSchedule } = useSchedule();
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  // Mock data parts
  const parts = [
    {
      name: "29N Muffler",
      customer: "Sakura",
      icon: "🔧",
    },
    {
      name: "Transmission Case B2",
      customer: "Honda Corp",
      icon: "⚙️",
    },
    {
      name: "Brake Disc C3",
      customer: "Nissan Ltd",
      icon: "🛞",
    },
  ];

  // Group schedules by part
  const getSchedulesByPart = (partName: string) => {
    return savedSchedules.filter((schedule) => schedule.form.part === partName);
  };

  const handleLoadSchedule = (savedSchedule: any) => {
    loadSchedule(savedSchedule);
    navigate("/dashboard/scheduler");
  };

  const handleDeleteSchedule = (scheduleId: string, scheduleName: string) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus schedule "${scheduleName}"?`,
    );
    if (confirmDelete) {
      deleteSchedule(scheduleId);
    }
  };

  // Fungsi untuk download schedule sebagai file Excel
  const handleDownloadExcel = (schedule: any) => {
    // Persiapkan data untuk Excel
    const timePerPcs = schedule.form.timePerPcs || 257;
    const initialStock = schedule.form.initialStock || 0;

    // Hitung semua nilai yang diperlukan seperti di ScheduleTable.tsx
    const scheduleData = schedule.schedule.map((item: any, index: number) => {
      // Hitung nilai-nilai yang sama seperti di ScheduleTable
      const planningHour = item.planningHour || 0;
      const overtimeHour = item.overtimeHour || 0;
      const delivery = item.delivery || 0;

      // Hitung planning dan overtime PCS seperti di ScheduleTable.tsx
      const planningPcs =
        planningHour > 0 ? Math.floor((planningHour * 3600) / timePerPcs) : 0;
      const overtimePcs =
        overtimeHour > 0 ? Math.floor((overtimeHour * 3600) / timePerPcs) : 0;
      const hasilProduksi = planningPcs + overtimePcs;

      // Hitung stok dengan cara yang sama seperti di ScheduleTable.tsx
      const prevStock =
        index === 0
          ? initialStock
          : schedule.schedule[index - 1].rencanaStock || initialStock;
      const rencanaStock = prevStock + hasilProduksi - delivery;

      // Kembalikan data dalam format yang sama dengan ScheduleTable.tsx
      return {
        No: index + 1,
        Hari: item.day,
        Shift: item.shift,
        Waktu: item.time,
        Status: item.status,
        "Stok Awal": prevStock,
        Delivery: delivery,
        "Planning Hour": planningHour,
        "Overtime Hour": overtimeHour,
        "Planning PCS": planningPcs,
        "Overtime PCS": overtimePcs,
        "Hasil Produksi": hasilProduksi,
        "Stok Akhir": rencanaStock,
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
    XLSX.writeFile(wb, `${schedule.name}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Saved Schedules</h1>
        <p className="text-gray-400 mb-8">
          Manage your saved production schedules by part
        </p>

        {!selectedPart ? (
          // Part selection view
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {parts.map((part) => {
              const partSchedules = getSchedulesByPart(part.name);
              return (
                <div
                  key={part.name}
                  onClick={() => setSelectedPart(part.name)}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:bg-gray-750 cursor-pointer transition-all duration-300 hover:scale-105 hover:border-blue-500"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-4">{part.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {part.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      {part.customer}
                    </p>
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm inline-block">
                      {partSchedules.length} laporan tersimpan
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Schedule list view for selected part
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedPart(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Kembali
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedPart}
                  </h2>
                  <p className="text-gray-400">
                    {parts.find((p) => p.name === selectedPart)?.customer}
                  </p>
                </div>
              </div>
            </div>

            {getSchedulesByPart(selectedPart).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  Belum ada laporan tersimpan
                </h3>
                <p className="text-gray-500">
                  Buat schedule baru untuk part ini
                </p>
                <button
                  onClick={() => navigate("/dashboard/scheduler")}
                  className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Buat Schedule Baru
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getSchedulesByPart(selectedPart).map((schedule) => (
                  <div
                    key={schedule.id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-blue-400"
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
                        <h4 className="font-semibold text-white">
                          {schedule.name}
                        </h4>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Dibuat:{" "}
                      {new Date(schedule.date).toLocaleDateString("id-ID")}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadSchedule(schedule)}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                      >
                        Tampilkan
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteSchedule(schedule.id, schedule.name)
                        }
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                      >
                        Hapus
                      </button>
                      <button
                        onClick={() => handleDownloadExcel(schedule)}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                        title="Download Excel"
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
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedSchedulesPage;
