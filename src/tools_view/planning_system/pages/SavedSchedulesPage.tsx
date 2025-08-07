import React, { useState } from "react";
import { useSchedule } from "../contexts/ScheduleContext";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { Colors } from "../../const/colors";
import { useTheme } from "../../contexts/ThemeContext";
import {
  ArrowLeft,
  Calendar,
  Download,
  Eye,
  Trash2,
  Package,
  Cog,
  FileText,
  Clock,
  CheckCircle,
  Edit3,
  Save,
  X,
} from "lucide-react";

const SavedSchedulesPage: React.FC = () => {
  const navigate = useNavigate();
  const { savedSchedules, loadSchedule, deleteSchedule, updateSchedule } =
    useSchedule();
  const { theme } = useTheme();
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);

  // State untuk editing di header
  const [isEditingHeader, setIsEditingHeader] = useState<boolean>(false);
  const [editingHeaderPartName, setEditingHeaderPartName] =
    useState<string>("");
  const [editingHeaderCustomerName, setEditingHeaderCustomerName] =
    useState<string>("");

  // State untuk editing part overview
  const [editingPartName, setEditingPartName] = useState<string>("");
  const [editingPartCustomer, setEditingPartCustomer] = useState<string>("");
  const [editingPartId, setEditingPartId] = useState<string | null>(null);

  // Fungsi untuk mendapatkan warna berdasarkan theme
  const getThemeColors = () => {
    const isDark = theme === "dark";
    return {
      // Background colors
      pageBg: isDark ? "bg-gray-900" : "bg-gray-50",
      cardBg: isDark ? "bg-gray-800/50" : "bg-white",
      headerBg: isDark ? "bg-gray-800/50" : "bg-white",
      emptyStateBg: isDark ? "bg-gray-800/30" : "bg-gray-50",

      // Text colors
      titleText: isDark ? "text-white" : "text-gray-900",
      subtitleText: isDark ? "text-gray-400" : "text-gray-600",
      bodyText: isDark ? "text-gray-400" : "text-gray-700",
      descriptionText: isDark ? "text-gray-500" : "text-gray-500",

      // Border colors
      borderColor: isDark ? "border-gray-800" : "border-gray-200",
      cardBorder: isDark ? "border-gray-700" : "border-gray-200",
      headerBorder: isDark ? "border-gray-700" : "border-gray-200",

      // Button colors
      backButtonBg: isDark ? "bg-gray-700" : "bg-gray-100",
      backButtonHover: isDark ? "hover:bg-gray-600" : "hover:bg-gray-200",
      backButtonText: isDark ? "text-white" : "text-gray-700",

      // Divider colors
      dividerColor: isDark ? "bg-gray-600" : "bg-gray-300",

      // Hover effects
      cardHover: isDark ? "hover:bg-gray-750" : "hover:bg-gray-50",
      cardHoverBorder: isDark
        ? "hover:border-blue-500/50"
        : "hover:border-blue-300",

      // Gradient effects
      gradientOverlay: isDark
        ? "from-blue-500/5 to-purple-500/5"
        : "from-blue-500/10 to-purple-500/10",
    };
  };

  // Generate parts dynamically from saved schedules
  const generatePartsFromSchedules = () => {
    const uniqueParts = new Map();

    savedSchedules.forEach((schedule) => {
      const partName = schedule.form.part;
      const customer = schedule.form.customer;

      if (!uniqueParts.has(partName)) {
        // Generate color and styling based on part name
        const colorVariants = [
          {
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-500",
            borderColor: "border-blue-500/30",
          },
          {
            color: "from-green-500 to-green-600",
            bgColor: "bg-green-500",
            borderColor: "border-green-500/30",
          },
          {
            color: "from-purple-500 to-purple-600",
            bgColor: "bg-purple-500",
            borderColor: "border-purple-500/30",
          },
          {
            color: "from-orange-500 to-orange-600",
            bgColor: "bg-orange-500",
            borderColor: "border-orange-500/30",
          },
          {
            color: "from-red-500 to-red-600",
            bgColor: "bg-red-500",
            borderColor: "border-red-500/30",
          },
          {
            color: "from-indigo-500 to-indigo-600",
            bgColor: "bg-indigo-500",
            borderColor: "border-indigo-500/30",
          },
        ];

        const colorIndex = uniqueParts.size % colorVariants.length;
        const colorVariant = colorVariants[colorIndex];

        uniqueParts.set(partName, {
          name: partName,
          customer: customer,
          icon: Package, // Default icon, bisa diubah berdasarkan part name
          color: colorVariant.color,
          bgColor: colorVariant.bgColor,
          borderColor: colorVariant.borderColor,
          description: `Jadwal produksi untuk ${partName}`,
        });
      }
    });

    return Array.from(uniqueParts.values());
  };

  const parts = generatePartsFromSchedules();

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

  // Fungsi untuk memulai editing di header
  const handleStartHeaderEdit = () => {
    setIsEditingHeader(true);
    setEditingHeaderPartName(selectedPart || "");
    setEditingHeaderCustomerName(
      parts.find((p) => p.name === selectedPart)?.customer || "",
    );
  };

  // Fungsi untuk handle keyboard events di header
  const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveHeaderEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelHeaderEdit();
    }
  };

  // Fungsi untuk menyimpan perubahan di header
  const handleSaveHeaderEdit = () => {
    if (!editingHeaderPartName.trim() || !editingHeaderCustomerName.trim()) {
      alert("Nama part dan customer tidak boleh kosong!");
      return;
    }

    // Update semua schedule yang memiliki part name yang sama
    const schedulesToUpdate = savedSchedules.filter(
      (schedule) => schedule.form.part === selectedPart,
    );

    schedulesToUpdate.forEach((schedule) => {
      const updatedSchedule = {
        ...schedule,
        form: {
          ...schedule.form,
          part: editingHeaderPartName.trim(),
          customer: editingHeaderCustomerName.trim(),
        },
      };
      updateSchedule(schedule.id, updatedSchedule);
    });

    setIsEditingHeader(false);
    setEditingHeaderPartName("");
    setEditingHeaderCustomerName("");

    // Show success message
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Fungsi untuk membatalkan editing di header
  const handleCancelHeaderEdit = () => {
    setIsEditingHeader(false);
    setEditingHeaderPartName("");
    setEditingHeaderCustomerName("");
  };

  // Fungsi untuk memulai editing part overview
  const handleStartPartEdit = (partName: string, customer: string) => {
    setEditingPartId(partName);
    setEditingPartName(partName);
    setEditingPartCustomer(customer);
  };

  // Fungsi untuk handle keyboard events part overview
  const handlePartKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSavePartEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelPartEdit();
    }
  };

  // Fungsi untuk menyimpan perubahan part overview
  const handleSavePartEdit = () => {
    if (!editingPartName.trim() || !editingPartCustomer.trim()) {
      alert("Nama part dan customer tidak boleh kosong!");
      return;
    }

    // Update semua schedule yang memiliki part name yang sama
    const schedulesToUpdate = savedSchedules.filter(
      (schedule) => schedule.form.part === editingPartId,
    );

    schedulesToUpdate.forEach((schedule) => {
      const updatedSchedule = {
        ...schedule,
        form: {
          ...schedule.form,
          part: editingPartName.trim(),
          customer: editingPartCustomer.trim(),
        },
      };
      updateSchedule(schedule.id, updatedSchedule);
    });

    setEditingPartId(null);
    setEditingPartName("");
    setEditingPartCustomer("");

    // Show success message
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Fungsi untuk membatalkan editing part overview
  const handleCancelPartEdit = () => {
    setEditingPartId(null);
    setEditingPartName("");
    setEditingPartCustomer("");
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

  const colors = getThemeColors();

  return (
    <div
      className={`${colors.pageBg} border ${colors.borderColor} rounded-3xl p-8 shadow-lg`}
    >
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className={`text-green-600 dark:text-green-400 font-medium`}>
            Berhasil menyimpan perubahan part dan customer!
          </span>
        </div>
      )}

      <h1 className={`text-3xl font-bold ${colors.titleText} mb-2`}>
        Saved Schedules
      </h1>
      <p className={`${colors.subtitleText} mb-8`}>
        Manage your saved production schedules by part
      </p>

      {!selectedPart ? (
        // Part selection view dengan desain yang lebih menarik
        <>
          {parts.length === 0 ? (
            // Empty state ketika tidak ada schedule tersimpan
            <div
              className={`${colors.emptyStateBg} border ${colors.cardBorder} rounded-2xl p-12 text-center`}
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                <Package className="w-10 h-10 text-white" />
              </div>
              <h3 className={`text-xl font-bold ${colors.titleText} mb-3`}>
                Belum Ada Jadwal Tersimpan
              </h3>
              <p className={`${colors.bodyText} mb-6 max-w-md mx-auto`}>
                Anda belum memiliki jadwal produksi yang tersimpan. Buat jadwal
                baru di halaman Scheduler untuk melihatnya di sini.
              </p>
              <button
                onClick={() => navigate("/dashboard/scheduler")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg"
              >
                Buat Jadwal Baru
              </button>
            </div>
          ) : (
            // Grid untuk menampilkan parts yang ada
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {parts.map((part) => {
                const partSchedules = getSchedulesByPart(part.name);
                return (
                  <div
                    key={part.name}
                    className={`group relative ${colors.cardBg} border ${part.borderColor} rounded-2xl p-6 ${colors.cardHover} transition-all duration-500 hover:scale-105 hover:shadow-2xl backdrop-blur-sm overflow-hidden`}
                  >
                    {/* Background gradient effect */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${part.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                    ></div>

                    {/* Edit button - Professional floating button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartPartEdit(part.name, part.customer);
                      }}
                      className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-lg hover:scale-110 shadow-lg border border-white/20"
                      title="Edit nama part dan customer"
                    >
                      <Edit3 className="w-4 h-4 text-white" />
                    </button>

                    {/* Clickable area for navigation */}
                    <div
                      onClick={() => setSelectedPart(part.name)}
                      className="cursor-pointer"
                    >
                      {/* Icon container */}
                      <div
                        className={`relative z-10 ${part.bgColor} w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Package className="w-8 h-8 text-white" />
                      </div>

                      <div className="relative z-10 text-center">
                        {editingPartId === part.name ? (
                          // Editing mode
                          <div className="space-y-3">
                            <div
                              className={`text-xs ${colors.bodyText} text-center p-2 bg-blue-500/10 rounded-lg border border-blue-500/20`}
                            >
                              💡 Tekan{" "}
                              <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                                Enter
                              </kbd>{" "}
                              untuk simpan,{" "}
                              <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                                Esc
                              </kbd>{" "}
                              untuk batal
                            </div>
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingPartName}
                                onChange={(e) =>
                                  setEditingPartName(e.target.value)
                                }
                                onKeyDown={handlePartKeyDown}
                                className={`w-full px-3 py-2 text-sm border ${colors.cardBorder} rounded-lg ${colors.cardBg} ${colors.titleText} focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-center`}
                                placeholder="Nama Part"
                                autoFocus
                              />
                              <input
                                type="text"
                                value={editingPartCustomer}
                                onChange={(e) =>
                                  setEditingPartCustomer(e.target.value)
                                }
                                onKeyDown={handlePartKeyDown}
                                className={`w-full px-3 py-2 text-sm border ${colors.cardBorder} rounded-lg ${colors.cardBg} ${colors.bodyText} focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-center`}
                                placeholder="Nama Customer"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSavePartEdit();
                                }}
                                className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                Simpan
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelPartEdit();
                                }}
                                className="flex-1 px-3 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <>
                            <h3
                              className={`text-xl font-bold ${colors.titleText} mb-2 group-hover:text-gray-100 transition-colors`}
                            >
                              {part.name}
                            </h3>
                            <p className={`${colors.bodyText} text-sm mb-2`}>
                              {part.customer}
                            </p>
                            <p
                              className={`${colors.descriptionText} text-xs mb-4`}
                            >
                              {part.description}
                            </p>
                            <div
                              className={`bg-gradient-to-r ${part.color} text-white px-4 py-2 rounded-full text-sm font-medium inline-block shadow-lg`}
                            >
                              {partSchedules.length} jadwal tersimpan
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/30 rounded-2xl transition-all duration-300"></div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        // Schedule list view for selected part dengan tombol kembali di atas
        <>
          {/* Header dengan tombol kembali - Layout Compact */}
          <div
            className={`mb-8 p-4 ${colors.headerBg} rounded-xl border ${colors.headerBorder}`}
          >
            {/* Single row - Back button, part info, and total schedules */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Back button - Icon only */}
              <button
                onClick={() => setSelectedPart(null)}
                className={`flex items-center justify-center p-2 ${colors.backButtonBg} ${colors.backButtonHover} ${colors.backButtonText} rounded-lg transition-all duration-200 hover:scale-105 group flex-shrink-0`}
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </button>

              {/* Part info - Icon and text */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div
                  className={`${(() => {
                    const selectedPartData = parts.find(
                      (p) => p.name === selectedPart,
                    );
                    return selectedPartData?.bgColor || "";
                  })()} p-1.5 sm:p-2 rounded-lg flex-shrink-0`}
                >
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>

                <div className="min-w-0 flex-1">
                  {isEditingHeader ? (
                    // Editing mode di header
                    <div className="space-y-2">
                      <div
                        className={`text-xs ${colors.bodyText} text-center p-1 bg-blue-500/10 rounded border border-blue-500/20`}
                      >
                        💡 Tekan{" "}
                        <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                          Enter
                        </kbd>{" "}
                        untuk simpan,{" "}
                        <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                          Esc
                        </kbd>{" "}
                        untuk batal
                      </div>
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={editingHeaderPartName}
                          onChange={(e) =>
                            setEditingHeaderPartName(e.target.value)
                          }
                          onKeyDown={handleHeaderKeyDown}
                          className={`w-full px-2 py-1 text-sm border ${colors.cardBorder} rounded ${colors.cardBg} ${colors.titleText} focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold`}
                          placeholder="Nama Part"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={editingHeaderCustomerName}
                          onChange={(e) =>
                            setEditingHeaderCustomerName(e.target.value)
                          }
                          onKeyDown={handleHeaderKeyDown}
                          className={`w-full px-2 py-1 text-sm border ${colors.cardBorder} rounded ${colors.cardBg} ${colors.bodyText} focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                          placeholder="Nama Customer"
                        />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={handleSaveHeaderEdit}
                          className="flex-1 px-2 py-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Simpan
                        </button>
                        <button
                          onClick={handleCancelHeaderEdit}
                          className="flex-1 px-2 py-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode di header
                    <div className="group relative">
                      <h2
                        className={`text-base sm:text-lg lg:text-xl xl:text-2xl font-bold ${colors.titleText} truncate cursor-pointer hover:text-blue-400 transition-colors`}
                        onClick={handleStartHeaderEdit}
                        title="Klik untuk edit nama part dan customer"
                      >
                        {selectedPart}
                      </h2>
                      <p
                        className={`${colors.bodyText} text-xs sm:text-sm lg:text-base truncate cursor-pointer hover:text-blue-400 transition-colors`}
                        onClick={handleStartHeaderEdit}
                        title="Klik untuk edit nama part dan customer"
                      >
                        {parts.find((p) => p.name === selectedPart)?.customer}
                      </p>
                      <button
                        onClick={handleStartHeaderEdit}
                        className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-blue-500/10 hover:bg-blue-500/20 rounded-full"
                        title="Edit nama part dan customer"
                      >
                        <Edit3 className="w-3 h-3 text-blue-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Total schedules with border */}
              <div
                className={`px-2 sm:px-4 py-1.5 sm:py-2 border ${colors.cardBorder} rounded-lg bg-opacity-50 ${colors.cardBg} flex-shrink-0`}
              >
                <div className={`text-xs ${colors.bodyText} text-center`}>
                  Total Schedules
                </div>
                <div
                  className={`text-sm sm:text-lg lg:text-xl font-bold ${colors.titleText} text-center`}
                >
                  {getSchedulesByPart(selectedPart).length}
                </div>
              </div>
            </div>
          </div>

          {getSchedulesByPart(selectedPart).length === 0 ? (
            <div
              className={`text-center py-16 ${colors.emptyStateBg} rounded-2xl border ${colors.cardBorder}`}
            >
              <div className="text-gray-500 text-8xl mb-6">📅</div>
              <h3 className={`text-2xl font-semibold ${colors.bodyText} mb-3`}>
                Belum ada laporan tersimpan
              </h3>
              <p className={`${colors.descriptionText} mb-6 max-w-md mx-auto`}>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {getSchedulesByPart(selectedPart).map((schedule) => (
                <div
                  key={schedule.id}
                  className={`group ${colors.cardBg} border ${colors.cardBorder} rounded-xl p-6 ${colors.cardHoverBorder} ${colors.cardHover} transition-all duration-300 hover:scale-105 backdrop-blur-sm relative overflow-hidden`}
                >
                  {/* Background gradient on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${colors.gradientOverlay} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  ></div>

                  <div className="relative z-10">
                    {/* Header dengan ikon dan nama */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h4
                            className={`font-semibold ${colors.titleText} group-hover:text-blue-100 transition-colors`}
                          >
                            {schedule.name}
                          </h4>
                          <p
                            className={`${colors.bodyText} text-xs flex items-center gap-1`}
                          >
                            <Clock className="w-3 h-3" />
                            Dibuat: {formatDate(schedule.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-green-500/10 rounded-full">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                      </div>
                    </div>

                    {/* Part and Customer Info - Read Only */}
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-400" />
                        <span className={`text-sm ${colors.bodyText}`}>
                          <span className="font-medium">Part:</span>{" "}
                          {schedule.form.part}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Cog className="w-4 h-4 text-purple-400" />
                        <span className={`text-sm ${colors.bodyText}`}>
                          <span className="font-medium">Customer:</span>{" "}
                          {schedule.form.customer}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons - Responsive */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleLoadSchedule(schedule)}
                        className="flex-1 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-1 sm:gap-2 group/btn"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 group-hover/btn:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Tampilkan</span>
                        <span className="sm:hidden">Lihat</span>
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadExcel(schedule)}
                          className="flex-1 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-xs sm:text-sm transition-all duration-200 hover:scale-105 group/btn"
                          title="Download Excel"
                        >
                          <Download className="w-3 h-3 sm:w-4 sm:h-4 group-hover/btn:scale-110 transition-transform" />
                          <span className="hidden sm:inline">Download</span>
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteSchedule(schedule.id, schedule.name)
                          }
                          className="flex-1 px-3 sm:px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-xs sm:text-sm transition-all duration-200 hover:scale-105 group/btn"
                          title="Hapus Schedule"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 group-hover/btn:scale-110 transition-transform" />
                          <span className="hidden sm:inline">Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SavedSchedulesPage;
