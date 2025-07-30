import React, { useState } from "react";
import { useSchedule } from "../contexts/ScheduleContext";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { Colors } from "../../const/colors";
import {
  ArrowLeft,
  Calendar,
  Download,
  Eye,
  Trash2,
  Package,
  Wrench,
  Cog,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Factory,
  Gauge,
  Settings2,
  Car,
  Zap,
  Shield,
} from "lucide-react";

const SavedSchedulesPage: React.FC = () => {
  const navigate = useNavigate();
  const { savedSchedules, loadSchedule, deleteSchedule } = useSchedule();
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  // Mock data parts dengan ikon yang lebih cantik
  const parts = [
    {
      name: Colors.parts.muffler.name,
      customer: Colors.parts.muffler.customer,
      icon: Package,
      color: Colors.parts.muffler.color,
      bgColor: Colors.parts.muffler.bgColor,
      borderColor: Colors.parts.muffler.borderColor,
      description: Colors.parts.muffler.description,
    },
    {
      name: Colors.parts.transmission.name,
      customer: Colors.parts.transmission.customer,
      icon: Cog,
      color: Colors.parts.transmission.color,
      bgColor: Colors.parts.transmission.bgColor,
      borderColor: Colors.parts.transmission.borderColor,
      description: Colors.parts.transmission.description,
    },
    {
      name: Colors.parts.brakeDisc.name,
      customer: Colors.parts.brakeDisc.customer,
      icon: Wrench,
      color: Colors.parts.brakeDisc.color,
      bgColor: Colors.parts.brakeDisc.bgColor,
      borderColor: Colors.parts.brakeDisc.borderColor,
      description: Colors.parts.brakeDisc.description,
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

  // Fungsi untuk format tanggal yang lebih baik
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Jika dateString bukan format tanggal yang valid, coba parse sebagai string biasa
        return dateString;
      }
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Saved Schedules</h1>
        <p className="text-gray-400 mb-8">
          Manage your saved production schedules by part
        </p>

        {!selectedPart ? (
          // Part selection view dengan desain yang lebih menarik
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {parts.map((part) => {
              const partSchedules = getSchedulesByPart(part.name);
              return (
                <div
                  key={part.name}
                  onClick={() => setSelectedPart(part.name)}
                  className={`group relative bg-gray-800/50 border ${part.borderColor} rounded-2xl p-6 hover:bg-gray-750 cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl backdrop-blur-sm overflow-hidden`}
                >
                  {/* Background gradient effect */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${part.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                  ></div>

                  {/* Icon container */}
                  <div
                    className={`relative z-10 ${part.bgColor} w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}
                  >
                    {part.icon === Package && (
                      <Package className="w-8 h-8 text-white" />
                    )}
                    {part.icon === Cog && (
                      <Cog className="w-8 h-8 text-white" />
                    )}
                    {part.icon === Wrench && (
                      <Wrench className="w-8 h-8 text-white" />
                    )}
                  </div>

                  <div className="relative z-10 text-center">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gray-100 transition-colors">
                      {part.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">
                      {part.customer}
                    </p>
                    <p className="text-gray-500 text-xs mb-4">
                      {part.description}
                    </p>
                    <div
                      className={`bg-gradient-to-r ${part.color} text-white px-4 py-2 rounded-full text-sm font-medium inline-block shadow-lg`}
                    >
                      {partSchedules.length} laporan tersimpan
                    </div>
                  </div>

                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/30 rounded-2xl transition-all duration-300"></div>
                </div>
              );
            })}
          </div>
        ) : (
          // Schedule list view for selected part dengan tombol kembali di atas
          <div>
            {/* Header dengan tombol kembali */}
            <div className="flex items-center justify-between mb-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedPart(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 hover:scale-105 group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Kembali
                </button>
                <div className="h-8 w-px bg-gray-600"></div>
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    {(() => {
                      const selectedPartData = parts.find(
                        (p) => p.name === selectedPart,
                      );
                      return (
                        <>
                          {selectedPartData && (
                            <div
                              className={`${selectedPartData.bgColor} p-2 rounded-lg`}
                            >
                              {selectedPartData.icon === Package && (
                                <Package className="w-6 h-6 text-white" />
                              )}
                              {selectedPartData.icon === Cog && (
                                <Cog className="w-6 h-6 text-white" />
                              )}
                              {selectedPartData.icon === Wrench && (
                                <Wrench className="w-6 h-6 text-white" />
                              )}
                            </div>
                          )}
                          {selectedPart}
                        </>
                      );
                    })()}
                  </h2>
                  <p className="text-gray-400">
                    {parts.find((p) => p.name === selectedPart)?.customer}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-400">Total Schedules</div>
                <div className="text-2xl font-bold text-white">
                  {getSchedulesByPart(selectedPart).length}
                </div>
              </div>
            </div>

            {getSchedulesByPart(selectedPart).length === 0 ? (
              <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-gray-700">
                <div className="text-gray-500 text-8xl mb-6">📅</div>
                <h3 className="text-2xl font-semibold text-gray-400 mb-3">
                  Belum ada laporan tersimpan
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Buat schedule baru untuk part ini dan simpan untuk akses cepat
                  di masa depan
                </p>
                <button
                  onClick={() => navigate("/dashboard/scheduler")}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
                >
                  <FileText className="w-5 h-5" />
                  Buat Schedule Baru
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getSchedulesByPart(selectedPart).map((schedule) => (
                  <div
                    key={schedule.id}
                    className="group bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 hover:bg-gray-750 transition-all duration-300 hover:scale-105 backdrop-blur-sm relative overflow-hidden"
                  >
                    {/* Background gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <div className="relative z-10">
                      {/* Header dengan ikon dan nama */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white group-hover:text-blue-100 transition-colors">
                              {schedule.name}
                            </h4>
                            <p className="text-gray-400 text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Dibuat: {formatDate(schedule.date)}
                            </p>
                          </div>
                        </div>
                        <div className="p-1 bg-green-500/10 rounded-full">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadSchedule(schedule)}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 group/btn"
                        >
                          <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          Tampilkan
                        </button>
                        <button
                          onClick={() => handleDownloadExcel(schedule)}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-sm transition-all duration-200 hover:scale-105 group/btn"
                          title="Download Excel"
                        >
                          <Download className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteSchedule(schedule.id, schedule.name)
                          }
                          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm transition-all duration-200 hover:scale-105 group/btn"
                          title="Hapus Schedule"
                        >
                          <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        </button>
                      </div>
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
