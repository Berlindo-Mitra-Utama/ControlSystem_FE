import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSchedule } from "../contexts/ScheduleContext";
import { useTheme } from "../../contexts/ThemeContext";
import StatsCards from "../components/layout/StatsCards";
import ProductionChart from "../components/layout/ProductionChart";
import { MONTHS } from "../utils/scheduleDateUtils";
import Modal from "../components/ui/Modal";

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

// Data part dari mockData di SchedulerPage dengan data dummy tambahan
const partOptions = [
  "29N Muffler", 
  "Transmission Case B2", 
  "Brake Disc C3",
  "Engine Block A7",  // Data dummy 1
  "Cylinder Head X5"  // Data dummy 2
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { savedSchedules } = useSchedule();
  const { uiColors } = useTheme();
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
    
    // Filter berdasarkan part jika dipilih
    if (selectedPart) {
      filtered = filtered.filter(
        (schedule) => schedule.form && schedule.form.part === selectedPart
      );
    }
    
    // Filter berdasarkan bulan dan tahun jika bulan dipilih
    if (selectedMonth !== null) {
      filtered = filtered.filter((schedule) => {
        const scheduleName = schedule.name || "";
        const monthMatch = scheduleName.includes(MONTHS[selectedMonth]);
        const yearMatch = scheduleName.includes(selectedYear.toString());
        return monthMatch && yearMatch;
      });
    }
    
    // Jika shift dipilih, filter schedule items berdasarkan shift
    if (selectedShift !== "all") {
      filtered = filtered.map(schedule => ({
        ...schedule,
        schedule: schedule.schedule.filter(item => item.shift === selectedShift)
      }));
    }
    
    return filtered;
  }, [savedSchedules, selectedPart, selectedMonth, selectedYear, selectedShift]);

  // Handler untuk tombol Lihat Semua
  const handleViewAllCharts = () => {
    navigate("/dashboard/allcharts");
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
                      {filteredPartOptions.map((part) => (
                        <button
                          key={part}
                          onClick={() => handlePartChange(part)}
                          className={`${uiColors.text.primary} hover:${uiColors.bg.tertiary} px-4 py-2 text-sm w-full text-left ${selectedPart === part ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                        >
                          {part}
                        </button>
                      ))}
                      {filteredPartOptions.length === 0 && (
                        <div className={`${uiColors.text.tertiary} px-4 py-2 text-sm italic`}>
                          Tidak ada part yang sesuai
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
        
        <StatsCards stats={stats} />

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
