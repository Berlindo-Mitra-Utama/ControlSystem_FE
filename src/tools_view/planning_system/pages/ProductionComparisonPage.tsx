import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSchedule } from "../contexts/ScheduleContext";
import { useTheme } from "../../contexts/ThemeContext";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";

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

interface SavedSchedule {
  id: string;
  name: string;
  date: string;
  form: any;
  schedule: ScheduleItem[];
}

const ProductionComparisonPage: React.FC = () => {
  const navigate = useNavigate();
  const { savedSchedules } = useSchedule();
  const { uiColors } = useTheme();

  // Data part yang tersedia
  const partOptions = [
    "29N Muffler", 
    "Transmission Case B2", 
    "Brake Disc C3",
    "Engine Block A7",
    "Cylinder Head X5"
  ];

  // State untuk filter
  const [selectedPart, setSelectedPart] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [selectedPartsForChart, setSelectedPartsForChart] = useState<string[]>(["29N Muffler"]);
  const [isPartDropdownOpen, setIsPartDropdownOpen] = useState<boolean>(false);
  const [partSearchTerm, setPartSearchTerm] = useState<string>("");

  // Data untuk chart per part
  const chartData = React.useMemo(() => {
    if (!savedSchedules || savedSchedules.length === 0) {
      return [];
    }

    // Filter schedule berdasarkan part yang dipilih
    let filteredSchedules = savedSchedules;
    if (selectedPart) {
      filteredSchedules = savedSchedules.filter(
        (schedule) => schedule.form && schedule.form.part === selectedPart
      );
    }

    // Filter berdasarkan bulan dan tahun jika dipilih
    if (selectedMonth) {
      filteredSchedules = filteredSchedules.filter((schedule) => {
        const scheduleName = schedule.name || "";
        return scheduleName.includes(selectedMonth) && scheduleName.includes(selectedYear.toString());
      });
    }

    // Kelompokkan data berdasarkan part
    const partData = partOptions.map(part => {
      const partSchedules = filteredSchedules.filter(
        (schedule) => schedule.form && schedule.form.part === part
      );

      let totalRencana = 0;
      let totalActual = 0;

      partSchedules.forEach(schedule => {
        schedule.schedule.forEach(item => {
          totalRencana += item.planningPcs || 0;
          totalActual += item.hasilProduksi || 0;
        });
      });

      return {
        part,
        rencanaProduksi: totalRencana,
        actualProduksi: totalActual,
        gap: totalRencana - totalActual,
        percentage: totalRencana > 0 ? ((totalActual / totalRencana) * 100) : 0
      };
    });

    return partData;
  }, [savedSchedules, selectedPart, selectedMonth, selectedYear]);

  // Data untuk chart custom part selection
  const customChartData = React.useMemo(() => {
    if (!savedSchedules || savedSchedules.length === 0 || selectedPartsForChart.length === 0) {
      return [];
    }

    // Filter berdasarkan bulan dan tahun jika dipilih
    let filteredSchedules = savedSchedules;
    if (selectedMonth) {
      filteredSchedules = savedSchedules.filter((schedule) => {
        const scheduleName = schedule.name || "";
        return scheduleName.includes(selectedMonth) && scheduleName.includes(selectedYear.toString());
      });
    }

    // Kelompokkan data berdasarkan part yang dipilih
    const partData = selectedPartsForChart.map(part => {
      const partSchedules = filteredSchedules.filter(
        (schedule) => schedule.form && schedule.form.part === part
      );

      let totalRencana = 0;
      let totalActual = 0;

      partSchedules.forEach(schedule => {
        schedule.schedule.forEach(item => {
          totalRencana += item.planningPcs || 0;
          totalActual += item.hasilProduksi || 0;
        });
      });

      return {
        part,
        rencanaProduksi: totalRencana,
        actualProduksi: totalActual,
        gap: totalRencana - totalActual,
        percentage: totalRencana > 0 ? ((totalActual / totalRencana) * 100) : 0
      };
    });

    return partData;
  }, [savedSchedules, selectedPartsForChart, selectedMonth, selectedYear]);

  // Handler untuk memilih part untuk chart custom
  const handlePartSelection = (part: string) => {
    setSelectedPartsForChart(prev => {
      if (prev.includes(part)) {
        return prev.filter(p => p !== part);
      } else {
        return [...prev, part];
      }
    });
  };

  // Handler untuk select all parts
  const handleSelectAll = () => {
    if (selectedPartsForChart.length === filteredPartOptions.length) {
      setSelectedPartsForChart([]);
    } else {
      setSelectedPartsForChart(filteredPartOptions);
    }
  };

  // Handler untuk clear all selections
  const handleClearAll = () => {
    setSelectedPartsForChart([]);
  };

  // Filter part berdasarkan search term
  const filteredPartOptions = partOptions.filter(part =>
    part.toLowerCase().includes(partSearchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.part-dropdown-container')) {
        setIsPartDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`w-full min-h-screen ${uiColors.bg.primary}`}>
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className={`text-3xl font-bold ${uiColors.text.accent}`}>
              Production Comparison Analysis
            </h1>
          </div>
          <p className={`text-lg ${uiColors.text.secondary}`}>
            Analisis perbandingan rencana dan actual produksi per part dan per bulan
          </p>
        </div>

        {/* Filter Section */}
        <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Part Filter */}
            <div className="relative part-dropdown-container">
              <label className={`block mb-2 text-sm font-medium ${uiColors.text.primary}`}>
                Pilih Part:
              </label>
              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={selectedPartsForChart.length > 0 ? `${selectedPartsForChart.length} part dipilih` : "Cari part..."}
                    value={partSearchTerm}
                    onChange={(e) => setPartSearchTerm(e.target.value)}
                    onFocus={() => setIsPartDropdownOpen(true)}
                    className={`${uiColors.bg.secondary} ${uiColors.text.primary} border ${uiColors.border.secondary} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPartDropdownOpen(!isPartDropdownOpen)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <svg className={`w-4 h-4 transition-transform ${isPartDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                {isPartDropdownOpen && (
                  <div className={`absolute z-10 w-full mt-1 ${uiColors.bg.secondary} border ${uiColors.border.secondary} rounded-lg shadow-xl max-h-80 overflow-hidden`}>
                    {/* Header dengan Select All dan Clear All */}
                    <div className={`p-3 border-b ${uiColors.border.secondary} bg-gray-50 dark:bg-gray-800`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium ${uiColors.text.secondary} uppercase tracking-wide`}>
                          Part Options
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSelectAll}
                            className={`px-2 py-1 text-xs rounded-md transition-colors ${
                              selectedPartsForChart.length === filteredPartOptions.length && filteredPartOptions.length > 0
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {selectedPartsForChart.length === filteredPartOptions.length && filteredPartOptions.length > 0 ? 'Deselect All' : 'Select All'}
                          </button>
                          {selectedPartsForChart.length > 0 && (
                            <button
                              onClick={handleClearAll}
                              className="px-2 py-1 text-xs rounded-md bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className={`text-xs ${uiColors.text.tertiary}`}>
                          {filteredPartOptions.length} part tersedia
                        </span>
                      </div>
                    </div>
                    
                    {/* List of parts */}
                    <div className="max-h-60 overflow-y-auto">
                      {filteredPartOptions.length > 0 ? (
                        filteredPartOptions.map((part) => (
                          <label key={part} className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                            <input
                              type="checkbox"
                              checked={selectedPartsForChart.includes(part)}
                              onChange={() => handlePartSelection(part)}
                              className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                            />
                            <span className={`text-sm ${uiColors.text.primary} flex-1`}>{part}</span>
                            {selectedPartsForChart.includes(part) && (
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </label>
                        ))
                      ) : (
                        <div className={`p-4 text-center`}>
                          <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                          </svg>
                          <p className={`text-sm ${uiColors.text.tertiary}`}>
                            Tidak ada part yang ditemukan
                          </p>
                          <p className={`text-xs ${uiColors.text.tertiary} mt-1`}>
                            Coba kata kunci lain
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Footer dengan summary */}
                    {selectedPartsForChart.length > 0 && (
                      <div className={`p-3 border-t ${uiColors.border.secondary} bg-blue-50 dark:bg-blue-900/20`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium ${uiColors.text.primary}`}>
                            {selectedPartsForChart.length} part dipilih
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {selectedPartsForChart.slice(0, 2).map((part) => (
                              <span key={part} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                                {part}
                              </span>
                            ))}
                            {selectedPartsForChart.length > 2 && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                                +{selectedPartsForChart.length - 2} lagi
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Month Filter */}
            <div>
              <label className={`block mb-2 text-sm font-medium ${uiColors.text.primary}`}>
                Pilih Bulan:
              </label>
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className={`${uiColors.bg.secondary} ${uiColors.text.primary} border ${uiColors.border.secondary} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full appearance-none pr-8`}
                >
                  <option value="">Semua Bulan</option>
                  <option value="Januari">Januari</option>
                  <option value="Februari">Februari</option>
                  <option value="Maret">Maret</option>
                  <option value="April">April</option>
                  <option value="Mei">Mei</option>
                  <option value="Juni">Juni</option>
                  <option value="Juli">Juli</option>
                  <option value="Agustus">Agustus</option>
                  <option value="September">September</option>
                  <option value="Oktober">Oktober</option>
                  <option value="November">November</option>
                  <option value="Desember">Desember</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Year Filter */}
            <div>
              <label className={`block mb-2 text-sm font-medium ${uiColors.text.primary}`}>
                Pilih Tahun:
              </label>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className={`${uiColors.bg.secondary} ${uiColors.text.primary} border ${uiColors.border.secondary} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full appearance-none pr-8`}
                >
                  {[2023, 2024, 2025].map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Chart Type Filter */}
            <div>
              <label className={`block mb-2 text-sm font-medium ${uiColors.text.primary}`}>
                Tipe Chart:
              </label>
              <div className="relative">
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as "bar" | "line")}
                  className={`${uiColors.bg.secondary} ${uiColors.text.primary} border ${uiColors.border.secondary} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full appearance-none pr-8`}
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Per Part */}
        <div className="mb-12">
          <div className={`w-full h-96 ${uiColors.bg.secondary} rounded-xl p-6`}>
            {selectedPartsForChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart
                    data={customChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={uiColors.bg.primary === "bg-gray-50" ? "#e5e7eb" : "#374151"} />
                    <XAxis 
                      dataKey="part" 
                      stroke={uiColors.bg.primary === "bg-gray-50" ? "#6b7280" : "#9ca3af"}
                      angle={-45}
                      textAnchor="end"
                      height={80}
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
                ) : (
                  <LineChart
                    data={customChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={uiColors.bg.primary === "bg-gray-50" ? "#e5e7eb" : "#374151"} />
                    <XAxis 
                      dataKey="part" 
                      stroke={uiColors.bg.primary === "bg-gray-50" ? "#6b7280" : "#9ca3af"}
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
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rencanaProduksi"
                      name="Rencana Produksi"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="actualProduksi"
                      name="Actual Produksi"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className={`text-lg ${uiColors.text.tertiary} text-center`}>
                  Pilih part yang ingin ditampilkan di chart
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Table - Dynamic berdasarkan part yang dipilih */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-semibold ${uiColors.text.accent}`}>
              Ringkasan Perbandingan
            </h2>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${uiColors.text.secondary}`}>
                {selectedPartsForChart.length > 0 
                  ? `Menampilkan ${selectedPartsForChart.length} part yang dipilih`
                  : 'Pilih part untuk melihat ringkasan'
                }
              </span>
            </div>
          </div>
          
          {selectedPartsForChart.length > 0 ? (
            <div className={`overflow-x-auto ${uiColors.bg.secondary} rounded-xl`}>
              <table className="w-full">
                <thead>
                  <tr className={`${uiColors.bg.tertiary}`}>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${uiColors.text.primary} uppercase tracking-wider`}>
                      Part
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${uiColors.text.primary} uppercase tracking-wider`}>
                      Rencana (PCS)
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${uiColors.text.primary} uppercase tracking-wider`}>
                      Actual (PCS)
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${uiColors.text.primary} uppercase tracking-wider`}>
                      Gap
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${uiColors.text.primary} uppercase tracking-wider`}>
                      Achievement (%)
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${uiColors.border.secondary}`}>
                  {customChartData.map((item, index) => (
                    <tr key={index} className={`${index % 2 === 0 ? uiColors.bg.secondary : uiColors.bg.tertiary}`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${uiColors.text.primary}`}>
                        {item.part}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${uiColors.text.primary}`}>
                        {item.rencanaProduksi.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${uiColors.text.primary}`}>
                        {item.actualProduksi.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${item.gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.gap >= 0 ? '+' : ''}{item.gap.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${item.percentage >= 100 ? 'text-green-600' : item.percentage >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {item.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={`${uiColors.bg.secondary} rounded-xl p-8 text-center`}>
              <p className={`text-lg ${uiColors.text.tertiary}`}>
                Pilih part untuk melihat ringkasan perbandingan
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductionComparisonPage;
