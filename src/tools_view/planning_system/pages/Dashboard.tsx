import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSchedule } from "../contexts/ScheduleContext";
import { useTheme } from "../../contexts/ThemeContext";
import StatsCards from "../components/layout/StatsCards";
import ProductionChart from "../components/layout/ProductionChart";
import { MONTHS } from "../utils/scheduleDateUtils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
// Import services untuk mengambil data dari database
import { ChildPartService, PlanningSystemService } from "../../../services/API_Services";

// Singkatan bulan untuk dropdown
const MONTH_ABBREVIATIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

interface ScheduleItem {
  id: string;
  day: number;
  shift: string;
  type: string;
  pcs: number;
  time: string;
  processes: string;
  status: "Normal" | "Gangguan" | "Completed";
  actualPcs?: number;
  notes?: string;
  delivery?: number;
  planningPcs?: number;
  overtimePcs?: number;
  planningHour?: number;
  overtimeHour?: number;
  jamProduksiAktual?: number;
  akumulasiDelivery?: number;
  hasilProduksi?: number;
  akumulasiHasilProduksi?: number;
  jamProduksiCycleTime?: number;
  actualStock?: number;
  rencanaStockCustom?: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { savedSchedules } = useSchedule();
  const { uiColors } = useTheme();
  
  // State untuk menyimpan data part dari database
  const [partOptions, setPartOptions] = useState<string[]>([]);
  const [childPartOptions, setChildPartOptions] = useState<string[]>([]);
  const [normalPartOptions, setNormalPartOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Debug: Log savedSchedules
  console.log("Dashboard - savedSchedules:", savedSchedules);
  console.log("Dashboard - savedSchedules length:", savedSchedules.length);
  
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    savedSchedules.length > 0
      ? savedSchedules[savedSchedules.length - 1].id
      : null,
  );
  
  // Ubah default menjadi string kosong untuk menampilkan semua part
  const [selectedPart, setSelectedPart] = useState<string>("");
  
  // State untuk pencarian part
  const [searchPart, setSearchPart] = useState<string>("");
  const [showPartDropdown, setShowPartDropdown] = useState<boolean>(false);
  
  // Mengambil data part dari database saat komponen dimuat
  useEffect(() => {
    const fetchPartData = async () => {
      setIsLoading(true);
      try {
        // Mengambil data dari ps_child_parts
        const childPartsResponse = await ChildPartService.getAllChildParts();
        const childParts = childPartsResponse.map(part => part.partName);
        setChildPartOptions(childParts);
        
        // Mengambil data dari ps_product_planning
        const productPlanningResponse = await PlanningSystemService.getAllProductPlanning();
        const productParts = productPlanningResponse.productPlannings.map(part => part.partName);
        setNormalPartOptions(productParts);
        
        // Menggabungkan data part dan menghilangkan duplikat
        const allParts = [...new Set([...childParts, ...productParts])];
        setPartOptions(allParts);
      } catch (error) {
        console.error("Error fetching part data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPartData();
  }, []);
  
  // Filter part berdasarkan pencarian
  const filteredPartOptions = partOptions.filter(part => {
    // Hapus semua spasi dari part dan search query untuk perbandingan
    const partNoSpaces = part.toLowerCase().replace(/\s+/g, "");
    const searchNoSpaces = searchPart.toLowerCase().replace(/\s+/g, "");
    return partNoSpaces.includes(searchNoSpaces);
  });
  
  // Tambahkan state untuk filter bulan dan shift dengan default kosong
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedShift, setSelectedShift] = useState<string>("all");
  
  // State untuk popup date picker
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [tempSelectedMonth, setTempSelectedMonth] = useState<number | null>(selectedMonth);
  const [tempSelectedYear, setTempSelectedYear] = useState(selectedYear);

  // Mendapatkan schedule yang dipilih
  const selectedSchedule = React.useMemo(() => {
    if (!selectedScheduleId) return [];
    const found = savedSchedules.find((s) => s.id === selectedScheduleId);
    return found ? found.schedule : [];
  }, [selectedScheduleId, savedSchedules]);

  // Mendapatkan semua schedule untuk part yang dipilih dengan filter bulan dan shift
  const filteredSchedules = React.useMemo(() => {
    // Mulai dengan semua schedule
    let filtered = [...savedSchedules];
    
    // Debug: Log initial filtered schedules
    console.log("Dashboard - Initial filtered schedules:", filtered);
    console.log("Dashboard - selectedPart:", selectedPart);
    console.log("Dashboard - selectedMonth:", selectedMonth);
    console.log("Dashboard - selectedYear:", selectedYear);
    console.log("Dashboard - selectedShift:", selectedShift);
    
    // Filter berdasarkan part jika dipilih
    if (selectedPart) {
      filtered = filtered.filter(
        (schedule) => schedule.form && schedule.form.part === selectedPart
      );
      console.log("Dashboard - After part filter:", filtered);
    }
    
    // Filter berdasarkan bulan dan tahun jika bulan dipilih
    if (selectedMonth !== null) {
      filtered = filtered.filter((schedule) => {
        const scheduleName = schedule.name || "";
        const monthMatch = scheduleName.includes(MONTHS[selectedMonth]);
        const yearMatch = scheduleName.includes(selectedYear.toString());
        return monthMatch && yearMatch;
      });
      console.log("Dashboard - After month/year filter:", filtered);
    }
    
    // Jika shift dipilih, filter schedule items berdasarkan shift
    if (selectedShift !== "all") {
      filtered = filtered.map(schedule => ({
        ...schedule,
        schedule: schedule.schedule.filter(item => item.shift === selectedShift)
      }));
      console.log("Dashboard - After shift filter:", filtered);
    }
    
    console.log("Dashboard - Final filtered schedules:", filtered);
    return filtered;
  }, [savedSchedules, selectedPart, selectedMonth, selectedYear, selectedShift]);

  // Handler untuk tombol Lihat Semua
  const handleViewAllCharts = () => {
    // Buka halaman "Semua Chart Akumulasi Delivery"
    navigate("/dashboard/all-delivery-charts");
  };

  // Handler untuk perubahan part
  const handlePartChange = (part: string) => {
    setSelectedPart(part);
    setSearchPart("");
    setShowPartDropdown(false);
  };
  
  // Handler untuk input pencarian part
  const handleSearchPartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPart(e.target.value);
    setShowPartDropdown(true);
  };
  
  // Handler untuk perubahan bulan
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedMonth(value === "" ? null : parseInt(value));
  };
  
  // Handler untuk perubahan shift
  const handleShiftChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedShift(e.target.value);
  };
  
  // Handler untuk membuka popup date picker
  const handleOpenDatePicker = () => {
    setTempSelectedMonth(selectedMonth);
    setTempSelectedYear(selectedYear);
    setShowDatePickerModal(true);
  };
  
  // Handler untuk konfirmasi pilihan bulan dan tahun
  const handleConfirmDateSelection = () => {
    setSelectedMonth(tempSelectedMonth);
    setSelectedYear(tempSelectedYear);
    setShowDatePickerModal(false);
  };

  // Tambahkan state untuk menentukan apakah part yang dipilih adalah child part
  const isSelectedPartChildPart = React.useMemo(() => {
    if (!selectedPart) return false;
    return childPartOptions.includes(selectedPart);
  }, [selectedPart, childPartOptions]);
  
  // Tambahkan state untuk menentukan apakah part yang dipilih adalah normal part
  const isSelectedPartNormalPart = React.useMemo(() => {
    if (!selectedPart) return false;
    return normalPartOptions.includes(selectedPart);
  }, [selectedPart, normalPartOptions]);
  
  // Calculate stats berdasarkan filter
  const stats = React.useMemo(() => {
    return {
      totalProduction: filteredSchedules.reduce((total, schedule) => {
        return (
          total +
          schedule.schedule.reduce((sum, item) => sum + (item.actualPcs || 0), 0)
        );
      }, 0),
      totalPlanned: filteredSchedules.reduce((total, schedule) => {
        return total + schedule.schedule.reduce((sum, item) => sum + item.pcs, 0);
      }, 0),
      totalDays: filteredSchedules.reduce((total, schedule) => {
        const maxDay = schedule.schedule.length > 0 ? 
          Math.max(...schedule.schedule.map((item) => item.day)) : 0;
        return total + maxDay;
      }, 0),
      disruptedItems: filteredSchedules.reduce((total, schedule) => {
        return (
          total +
          schedule.schedule.filter((item) => item.status === "Gangguan").length
        );
      }, 0),
      // Data baru sesuai gambar
      deliveryPlan: filteredSchedules.reduce((total, schedule) => {
        return total + schedule.schedule.reduce((sum, item) => sum + (item.delivery || 0), 0);
      }, 0),
      akumulasiDelivery: filteredSchedules.reduce((total, schedule) => {
        return total + schedule.schedule.reduce((sum, item) => sum + (item.akumulasiDelivery || 0), 0);
      }, 0),
      planningProduksiPcs: filteredSchedules.reduce((total, schedule) => {
        return total + schedule.schedule.reduce((sum, item) => sum + (item.planningPcs || 0), 0);
      }, 0),
      planningProduksiJam: filteredSchedules.reduce((total, schedule) => {
        return total + schedule.schedule.reduce((sum, item) => sum + (item.planningHour || 0), 0);
      }, 0),
      overtimePcs: filteredSchedules.reduce((total, schedule) => {
        return total + schedule.schedule.reduce((sum, item) => sum + (item.overtimePcs || 0), 0);
      }, 0),
      overtimeJam: filteredSchedules.reduce((total, schedule) => {
        return total + schedule.schedule.reduce((sum, item) => sum + (item.overtimeHour || 0), 0);
      }, 0),
      jamProduksiCycleTime: filteredSchedules.reduce((total, schedule) => {
        return total + schedule.schedule.reduce((sum, item) => sum + (item.jamProduksiCycleTime || 0), 0);
      }, 0),
      hasilProduksiAktual: filteredSchedules.reduce((total, schedule) => {
        return total + schedule.schedule.reduce((sum, item) => sum + (item.hasilProduksi || 0), 0);
      }, 0),
      akumulasiHasilProduksi: filteredSchedules.reduce((total, schedule) => {
        return total + schedule.schedule.reduce((sum, item) => sum + (item.akumulasiHasilProduksi || 0), 0);
      }, 0),
      actualStock: filteredSchedules.reduce((total, schedule) => {
        // Ambil nilai actualStock dari item terakhir dalam schedule
        const lastItem = schedule.schedule.length > 0 ? 
          schedule.schedule[schedule.schedule.length - 1] : null;
        return total + (lastItem?.actualStock || 0);
      }, 0),
      rencanaStock: filteredSchedules.reduce((total, schedule) => {
        // Ambil nilai rencanaStockCustom dari item terakhir dalam schedule
        const lastItem = schedule.schedule.length > 0 ? 
          schedule.schedule[schedule.schedule.length - 1] : null;
        return total + (lastItem?.rencanaStockCustom || 0);
      }, 0),
    };
  }, [filteredSchedules]);

  return (
    <div className={`w-full min-h-screen ${uiColors.bg.primary}`}>
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        <h1
          className={`text-2xl sm:text-3xl font-bold ${uiColors.text.accent} mb-4 sm:mb-8`}
        >
          Dashboard
        </h1>
        
        {/* Filter Section */}
        <div className="mb-6 p-4 bg-opacity-50 rounded-xl bg-gray-100 dark:bg-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Part Filter - Diubah menjadi searchable dropdown */}
            <div>
              <label
                htmlFor="partSearch"
                className={`block mb-2 text-sm font-medium ${uiColors.text.primary}`}
              >
                Pilih Part:
              </label>
              <div className="relative">
                <input
                  id="partSearch"
                  type="text"
                  value={searchPart}
                  onChange={handleSearchPartChange}
                  onFocus={() => setShowPartDropdown(true)}
                  placeholder={selectedPart || "Cari part..."}
                  className={`${uiColors.bg.secondary} ${uiColors.text.primary} border ${uiColors.border.secondary} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full`}
                />
                {showPartDropdown && (
              <div 
                className={`absolute z-10 mt-1 w-full ${uiColors.bg.secondary} border ${uiColors.border.secondary} rounded-md shadow-lg max-h-60 overflow-auto`}
              >
                <div className="py-1">
                  <button
                    onClick={() => handlePartChange("")}
                    className={`${uiColors.text.primary} hover:${uiColors.bg.tertiary} px-4 py-2 text-sm w-full text-left`}
                  >
                    Semua Part
                  </button>
                  {isLoading ? (
                    <div className={`${uiColors.text.tertiary} px-4 py-2 text-sm italic`}>
                      Memuat data part...
                    </div>
                  ) : (
                    filteredPartOptions.map((part) => (
                      <button
                        key={part}
                        onClick={() => handlePartChange(part)}
                        className={`${uiColors.text.primary} hover:${uiColors.bg.tertiary} px-4 py-2 text-sm w-full text-left ${selectedPart === part ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                      >
                        {part}
                      </button>
                    ))
                  )}
                  {!isLoading && filteredPartOptions.length === 0 && (
                    <div className={`${uiColors.text.tertiary} px-4 py-2 text-sm italic`}>
                      Tidak ada part yang ditemukan
                    </div>
                  )}
                </div>
              </div>
            )}
              </div>
            </div>
            
            {/* Month Filter - Changed to button that opens modal */}
            <div>
              <label
                className={`block mb-2 text-sm font-medium ${uiColors.text.primary}`}
              >
                Pilih Bulan:
              </label>
              <button
                onClick={handleOpenDatePicker}
                className={`${uiColors.bg.secondary} ${uiColors.text.primary} border ${uiColors.border.secondary} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full text-left flex justify-between items-center`}
              >
                <span>
                  {selectedMonth !== null ? `${MONTHS[selectedMonth]} ${selectedYear}` : "Semua Bulan"}
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            
            {/* Shift Filter */}
            <div>
              <label
                htmlFor="shiftSelect"
                className={`block mb-2 text-sm font-medium ${uiColors.text.primary}`}
              >
                Pilih Shift:
              </label>
              <select
                id="shiftSelect"
                value={selectedShift}
                onChange={handleShiftChange}
                className={`${uiColors.bg.secondary} ${uiColors.text.primary} border ${uiColors.border.secondary} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full`}
              >
                <option value="all">Semua Shift</option>
                <option value="1">Shift 1</option>
                <option value="2">Shift 2</option>
              </select>
            </div>
          </div>
        </div>
        
        <StatsCards 
          stats={stats} 
          isChildPart={isSelectedPartChildPart} 
          showAllMetrics={!selectedPart} // Tampilkan semua metrik jika tidak ada part yang dipilih
          isNormalPart={isSelectedPartNormalPart} // Tambahkan prop baru
        />

        {savedSchedules.length > 0 ? (
          <div className="mt-12 sm:mt-20">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2
                className={`text-2xl sm:text-3xl font-semibold ${uiColors.text.accent}`}
              >
                Production Chart
              </h2>
            </div>
            <ProductionChart
              schedules={filteredSchedules}
              onViewAllCharts={handleViewAllCharts}
            />
          </div>
        ) : (
          <div
            className={`mt-8 ${uiColors.bg.secondary} rounded-xl p-8 text-center`}
          >
            <p className={uiColors.text.tertiary}>
              Belum ada jadwal produksi yang dibuat
            </p>
          </div>
        )}

        {/* Chart Kedua: Perbandingan Rencana dan Actual Produksi */}
        {savedSchedules.length > 0 && (
          <div className="mt-12 sm:mt-20">
            <div className={`w-full h-96 ${uiColors.bg.secondary} rounded-xl p-4`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xl font-semibold ${uiColors.text.primary}`}>
                  {selectedPart ? `Perbandingan Rencana dan Actual Produksi - ${selectedPart} (Per Hari)` : "Perbandingan Rencana dan Actual Produksi per Bulan"}
                </h3>
                <button
                  onClick={() => navigate("/dashboard/all-production-monthly")}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                >
                  Lihat Semua
                </button>
              </div>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart
                  data={React.useMemo(() => {
                    console.log("Chart 2 - filteredSchedules:", filteredSchedules);
                    console.log("Chart 2 - selectedPart:", selectedPart);
                    
                    if (!filteredSchedules || filteredSchedules.length === 0) {
                      console.log("Chart 2 - No filtered schedules, using fallback data");
                      // Fallback data untuk testing
                      if (selectedPart) {
                        return [
                          { day: "Hari 1 (Shift 1)", rencanaProduksi: 100, actualProduksi: 95 },
                          { day: "Hari 2 (Shift 1)", rencanaProduksi: 120, actualProduksi: 110 },
                          { day: "Hari 3 (Shift 1)", rencanaProduksi: 90, actualProduksi: 85 },
                          { day: "Hari 4 (Shift 1)", rencanaProduksi: 110, actualProduksi: 105 },
                          { day: "Hari 5 (Shift 1)", rencanaProduksi: 130, actualProduksi: 125 }
                        ];
                      } else {
                        return [
                          { month: "Januari", rencanaProduksi: 500, actualProduksi: 480 },
                          { month: "Februari", rencanaProduksi: 600, actualProduksi: 570 },
                          { month: "Maret", rencanaProduksi: 550, actualProduksi: 520 }
                        ];
                      }
                    }

                    if (selectedPart) {
                      // Jika part dipilih, tampilkan data per hari untuk part tersebut
                      const partSchedules = filteredSchedules.filter(
                        (schedule) => schedule.form && schedule.form.part === selectedPart
                      );

                      console.log("Chart 2 - partSchedules for selected part:", partSchedules);

                      if (partSchedules.length === 0) {
                        console.log("Chart 2 - No schedules found for selected part, using fallback data");
                        // Fallback data untuk part yang dipilih
                        return [
                          { day: "Hari 1 (Shift 1)", rencanaProduksi: 100, actualProduksi: 95 },
                          { day: "Hari 2 (Shift 1)", rencanaProduksi: 120, actualProduksi: 110 },
                          { day: "Hari 3 (Shift 1)", rencanaProduksi: 90, actualProduksi: 85 },
                          { day: "Hari 4 (Shift 1)", rencanaProduksi: 110, actualProduksi: 105 },
                          { day: "Hari 5 (Shift 1)", rencanaProduksi: 130, actualProduksi: 125 }
                        ];
                      }

                      // Gabungkan semua schedule items dari part yang dipilih
                      const allItems: Array<{
                        day: number;
                        shift: string;
                        rencanaProduksi: number;
                        actualProduksi: number;
                        date: string;
                      }> = [];

                      partSchedules.forEach(schedule => {
                        console.log("Chart 2 - Processing schedule:", schedule.name, "with items:", schedule.schedule.length);
                        schedule.schedule.forEach(item => {
                          console.log("Chart 2 - Item:", item);
                          allItems.push({
                            day: item.day,
                            shift: item.shift,
                            rencanaProduksi: item.planningPcs || item.pcs || 0, // Fallback ke pcs jika planningPcs tidak ada
                            actualProduksi: item.hasilProduksi || item.actualPcs || 0, // Fallback ke actualPcs jika hasilProduksi tidak ada
                            date: schedule.name || ""
                          });
                        });
                      });

                      console.log("Chart 2 - All items before sorting:", allItems);

                      // Urutkan berdasarkan hari
                      allItems.sort((a, b) => a.day - b.day);

                      // Buat data untuk chart dengan label yang informatif
                      const chartData = allItems.map((item, index) => ({
                        day: `Hari ${item.day} (Shift ${item.shift})`,
                        rencanaProduksi: item.rencanaProduksi,
                        actualProduksi: item.actualProduksi,
                        originalDay: item.day,
                        shift: item.shift,
                        date: item.date
                      }));

                      console.log("Chart 2 - Final chart data:", chartData);
                      return chartData;
                    } else {
                      // Jika tidak ada part yang dipilih, tampilkan data per bulan seperti sebelumnya
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

                      // Inisialisasi data untuk semua bulan dengan nilai 0
                      const initialMonthlyData: Record<string, { 
                        rencanaProduksi: number; 
                        actualProduksi: number 
                      }> = {};
                      months.forEach((month) => {
                        initialMonthlyData[month] = { 
                          rencanaProduksi: 0, 
                          actualProduksi: 0 
                        };
                      });

                      // Mengelompokkan data berdasarkan bulan
                      const monthlyData = filteredSchedules.reduce<
                        Record<string, { 
                          rencanaProduksi: number; 
                          actualProduksi: number 
                        }>
                      >(
                        (acc, savedSchedule) => {
                          // Ekstrak bulan dari nama jadwal (format: "Bulan Tahun")
                          const scheduleName = savedSchedule.name;
                          const monthName = scheduleName.split(" ")[0]; // Ambil nama bulan saja

                          if (!acc[monthName]) {
                            acc[monthName] = { 
                              rencanaProduksi: 0, 
                              actualProduksi: 0 
                            };
                          }

                          // Hitung total rencana dan actual produksi untuk jadwal ini
                          let totalRencana = 0;
                          let totalActual = 0;

                          savedSchedule.schedule.forEach((item) => {
                            totalRencana += item.planningPcs || item.pcs || 0; // Fallback ke pcs jika planningPcs tidak ada
                            totalActual += item.hasilProduksi || item.actualPcs || 0; // Menggunakan hasilProduksi untuk actual produksi
                          });

                          // Tambahkan ke akumulator
                          acc[monthName].rencanaProduksi += totalRencana;
                          acc[monthName].actualProduksi += totalActual;

                          return acc;
                        },
                        initialMonthlyData, // Gunakan template yang sudah diinisialisasi
                      );

                      // Ubah ke format array untuk recharts
                      return months.map((month) => ({
                        month,
                        rencanaProduksi: monthlyData[month].rencanaProduksi,
                        actualProduksi: monthlyData[month].actualProduksi,
                      }));
                    }
                  }, [filteredSchedules, selectedPart])}
                  margin={{ top: 10, right: 30, left: 0, bottom: selectedPart ? 80 : 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={uiColors.bg.primary === "bg-gray-50" ? "#e5e7eb" : "#374151"}
                  />
                  <XAxis
                    dataKey={selectedPart ? "day" : "month"}
                    stroke={uiColors.bg.primary === "bg-gray-50" ? "#6b7280" : "#9ca3af"}
                    angle={selectedPart ? -45 : 0}
                    textAnchor={selectedPart ? "end" : "middle"}
                    height={selectedPart ? 80 : 60}
                  />
                  <YAxis stroke={uiColors.bg.primary === "bg-gray-50" ? "#6b7280" : "#9ca3af"} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: uiColors.bg.primary === "bg-gray-50" ? "#ffffff" : "#1f2937",
                      border: `1px solid ${uiColors.bg.primary === "bg-gray-50" ? "#d1d5db" : "#374151"}`,
                      borderRadius: "0.5rem",
                      color: uiColors.bg.primary === "bg-gray-50" ? "#111827" : "#f9fafb",
                    }}
                    labelStyle={{ color: uiColors.bg.primary === "bg-gray-50" ? "#111827" : "#f9fafb" }}
                    formatter={(value: any, name: string, props: any) => [
                      `${value} pcs`,
                      props && props.dataKey === "rencanaProduksi"
                        ? "Rencana Produksi"
                        : props && props.dataKey === "actualProduksi"
                        ? "Actual Produksi"
                        : name
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="rencanaProduksi"
                    name="Rencana Produksi"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="actualProduksi"
                    name="Actual Produksi"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              
              {/* Informasi tambahan untuk part yang dipilih */}
              {selectedPart && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      Menampilkan data per hari untuk <strong>{selectedPart}</strong>. 
                      Klik "Semua Part" untuk kembali ke tampilan per bulan.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chart Ketiga: Perbandingan Rencana dan Actual Jam Produksi per Bulan */}
        {savedSchedules.length > 0 && (
          <div className="mt-12 sm:mt-20">
            <div className={`w-full h-96 ${uiColors.bg.secondary} rounded-xl p-4`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xl font-semibold ${uiColors.text.primary}`}>
                  {selectedPart ? `Perbandingan Rencana dan Actual Jam Produksi - ${selectedPart} (Per Hari)` : "Perbandingan Rencana dan Actual Jam Produksi per Bulan"}
                </h3>
                <button
                  onClick={() => navigate("/dashboard/allcharts")}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                >
                  Lihat Semua
                </button>
              </div>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart
                  data={React.useMemo(() => {
                    console.log("Chart 3 - filteredSchedules:", filteredSchedules);
                    console.log("Chart 3 - selectedPart:", selectedPart);
                    
                    if (!filteredSchedules || filteredSchedules.length === 0) {
                      console.log("Chart 3 - No filtered schedules, using fallback data");
                      // Fallback data untuk testing
                      if (selectedPart) {
                        return [
                          { day: "Hari 1 (Shift 1)", rencanaJamProduksi: 8, actualJamProduksi: 7.5 },
                          { day: "Hari 2 (Shift 1)", rencanaJamProduksi: 8, actualJamProduksi: 7.8 },
                          { day: "Hari 3 (Shift 1)", rencanaJamProduksi: 8, actualJamProduksi: 7.2 },
                          { day: "Hari 4 (Shift 1)", rencanaJamProduksi: 8, actualJamProduksi: 7.9 },
                          { day: "Hari 5 (Shift 1)", rencanaJamProduksi: 8, actualJamProduksi: 8.1 }
                        ];
                      } else {
                        return [
                          { month: "Januari", rencanaJamProduksi: 160, actualJamProduksi: 150 },
                          { month: "Februari", rencanaJamProduksi: 160, actualJamProduksi: 155 },
                          { month: "Maret", rencanaJamProduksi: 160, actualJamProduksi: 148 }
                        ];
                      }
                    }

                    if (selectedPart) {
                      // Jika part dipilih, tampilkan data per hari untuk part tersebut
                      const partSchedules = filteredSchedules.filter(
                        (schedule) => schedule.form && schedule.form.part === selectedPart
                      );

                      console.log("Chart 3 - partSchedules for selected part:", partSchedules);

                      if (partSchedules.length === 0) {
                        console.log("Chart 3 - No schedules found for selected part, using fallback data");
                        // Fallback data untuk part yang dipilih
                        return [
                          { day: "Hari 1 (Shift 1)", rencanaJamProduksi: 8, actualJamProduksi: 7.5 },
                          { day: "Hari 2 (Shift 1)", rencanaJamProduksi: 8, actualJamProduksi: 7.8 },
                          { day: "Hari 3 (Shift 1)", rencanaJamProduksi: 8, actualJamProduksi: 7.2 },
                          { day: "Hari 4 (Shift 1)", rencanaJamProduksi: 8, actualJamProduksi: 7.9 },
                          { day: "Hari 5 (Shift 1)", rencanaJamProduksi: 8, actualJamProduksi: 8.1 }
                        ];
                      }

                      // Gabungkan semua schedule items dari part yang dipilih
                      const allItems: Array<{
                        day: number;
                        shift: string;
                        rencanaJamProduksi: number;
                        actualJamProduksi: number;
                        date: string;
                      }> = [];

                      partSchedules.forEach(schedule => {
                        console.log("Chart 3 - Processing schedule:", schedule.name, "with items:", schedule.schedule.length);
                        schedule.schedule.forEach(item => {
                          console.log("Chart 3 - Item:", item);
                          allItems.push({
                            day: item.day,
                            shift: item.shift,
                            rencanaJamProduksi: item.planningHour || 0,
                            actualJamProduksi: item.jamProduksiAktual || 0,
                            date: schedule.name || ""
                          });
                        });
                      });

                      console.log("Chart 3 - All items before sorting:", allItems);

                      // Urutkan berdasarkan hari
                      allItems.sort((a, b) => a.day - b.day);

                      // Buat data untuk chart dengan label yang informatif
                      const chartData = allItems.map((item, index) => ({
                        day: `Hari ${item.day} (Shift ${item.shift})`,
                        rencanaJamProduksi: item.rencanaJamProduksi,
                        actualJamProduksi: item.actualJamProduksi,
                        originalDay: item.day,
                        shift: item.shift,
                        date: item.date
                      }));

                      console.log("Chart 3 - Final chart data:", chartData);
                      return chartData;
                    } else {
                      // Jika tidak ada part yang dipilih, tampilkan data per bulan seperti sebelumnya
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

                      // Inisialisasi data untuk semua bulan dengan nilai 0
                      const initialMonthlyData: Record<string, { 
                        rencanaJamProduksi: number; 
                        actualJamProduksi: number 
                      }> = {};
                      months.forEach((month) => {
                        initialMonthlyData[month] = { 
                          rencanaJamProduksi: 0, 
                          actualJamProduksi: 0 
                        };
                      });

                      // Mengelompokkan data berdasarkan bulan
                      const monthlyData = filteredSchedules.reduce<
                        Record<string, { 
                          rencanaJamProduksi: number; 
                          actualJamProduksi: number 
                        }>
                      >(
                        (acc, savedSchedule) => {
                          // Ekstrak bulan dari nama jadwal (format: "Bulan Tahun")
                          const scheduleName = savedSchedule.name;
                          const monthName = scheduleName.split(" ")[0]; // Ambil nama bulan saja

                          if (!acc[monthName]) {
                            acc[monthName] = { 
                              rencanaJamProduksi: 0, 
                              actualJamProduksi: 0 
                            };
                          }

                          // Hitung total rencana dan actual jam produksi untuk jadwal ini
                          let totalRencanaJam = 0;
                          let totalActualJam = 0;

                          savedSchedule.schedule.forEach((item) => {
                            totalRencanaJam += item.planningHour || 0;
                            totalActualJam += item.jamProduksiAktual || 0; // Menggunakan jamProduksiAktual untuk actual jam produksi
                          });

                          // Tambahkan ke akumulator
                          acc[monthName].rencanaJamProduksi += totalRencanaJam;
                          acc[monthName].actualJamProduksi += totalActualJam;

                          return acc;
                        },
                        initialMonthlyData, // Gunakan template yang sudah diinisialisasi
                      );

                      // Ubah ke format array untuk recharts
                      return months.map((month) => ({
                        month,
                        rencanaJamProduksi: monthlyData[month].rencanaJamProduksi,
                        actualJamProduksi: monthlyData[month].actualJamProduksi,
                      }));
                    }
                  }, [filteredSchedules, selectedPart])}
                  margin={{ top: 10, right: 30, left: 0, bottom: selectedPart ? 80 : 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={uiColors.bg.primary === "bg-gray-50" ? "#e5e7eb" : "#374151"}
                  />
                  <XAxis
                    dataKey={selectedPart ? "day" : "month"}
                    stroke={uiColors.bg.primary === "bg-gray-50" ? "#6b7280" : "#9ca3af"}
                    angle={selectedPart ? -45 : 0}
                    textAnchor={selectedPart ? "end" : "middle"}
                    height={selectedPart ? 80 : 60}
                  />
                  <YAxis stroke={uiColors.bg.primary === "bg-gray-50" ? "#6b7280" : "#9ca3af"} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: uiColors.bg.primary === "bg-gray-50" ? "#ffffff" : "#1f2937",
                      border: `1px solid ${uiColors.bg.primary === "bg-gray-50" ? "#d1d5db" : "#374151"}`,
                      borderRadius: "0.5rem",
                      color: uiColors.bg.primary === "bg-gray-50" ? "#111827" : "#f9fafb",
                    }}
                    labelStyle={{ color: uiColors.bg.primary === "bg-gray-50" ? "#111827" : "#f9fafb" }}
                    formatter={(value: any, name: string, props: any) => [
                      `${value} jam`,
                      props && props.dataKey === "rencanaJamProduksi"
                        ? "Rencana Jam Produksi"
                        : props && props.dataKey === "actualJamProduksi"
                        ? "Actual Jam Produksi"
                        : name
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="rencanaJamProduksi"
                    name="Rencana Jam Produksi"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="actualJamProduksi"
                    name="Actual Jam Produksi"
                    fill="#ec4899"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              
              {/* Informasi tambahan untuk part yang dipilih */}
              {selectedPart && (
                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      Menampilkan data per hari untuk <strong>{selectedPart}</strong>. 
                      Klik "Semua Part" untuk kembali ke tampilan per bulan.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Month/Year Picker Modal */}
      {showDatePickerModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl w-full max-w-sm p-4">
            {/* Year Navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setTempSelectedYear(tempSelectedYear - 1)}
                className="p-1 hover:bg-gray-700 rounded transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4 text-gray-400 hover:text-white"
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
              </button>

              <div className="text-center">
                <span className="text-white font-bold text-xl">
                  {tempSelectedYear}
                </span>
              </div>

              <button
                onClick={() => setTempSelectedYear(tempSelectedYear + 1)}
                className="p-1 hover:bg-gray-700 rounded transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4 text-gray-400 hover:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Month Selection */}
            <div className="grid grid-cols-3 gap-1 mb-3">
              <button
                onClick={() => setTempSelectedMonth(null)}
                className={`p-2 rounded text-sm font-medium transition-all duration-200 ${
                  tempSelectedMonth === null
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                Semua
              </button>
              {MONTH_ABBREVIATIONS.map((monthAbbr, index) => (
                <button
                  key={index}
                  onClick={() => setTempSelectedMonth(index)}
                  className={`p-2 rounded text-sm font-medium transition-all duration-200 ${
                    tempSelectedMonth === index
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  {monthAbbr}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTempSelectedMonth(selectedMonth);
                  setTempSelectedYear(selectedYear);
                  setShowDatePickerModal(false);
                }}
                className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded transition-colors duration-200 text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDateSelection}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors duration-200 text-sm"
              >
                Pilih
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
};

export default Dashboard;
