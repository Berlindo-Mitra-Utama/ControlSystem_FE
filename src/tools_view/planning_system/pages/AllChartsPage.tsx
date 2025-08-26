import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSchedule } from "../contexts/ScheduleContext";
import { useTheme } from "../../contexts/ThemeContext";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const AllChartsPage: React.FC = () => {
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

  // Daftar bulan
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // State untuk filter
  const [selectedPart, setSelectedPart] = useState<string>("");
  const [searchPart, setSearchPart] = useState<string>("");
  const [showPartDropdown, setShowPartDropdown] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("Januari");
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(0);

  // Filter part berdasarkan pencarian
  const filteredPartOptions = partOptions.filter(part => {
    const partNoSpaces = part.toLowerCase().replace(/\s+/g, "");
    const searchNoSpaces = searchPart.toLowerCase().replace(/\s+/g, "");
    return partNoSpaces.includes(searchNoSpaces);
  });

  // Mendapatkan semua schedule untuk part yang dipilih
  const filteredSchedules = React.useMemo(() => {
    let filtered = [...savedSchedules];
    
    if (selectedPart) {
      filtered = filtered.filter(
        (schedule) => schedule.form && schedule.form.part === selectedPart
      );
    }
    
    return filtered;
  }, [savedSchedules, selectedPart]);

  // Filter bulan yang akan ditampilkan
  const filteredMonths = React.useMemo(() => {
    if (!selectedMonth) {
      return months;
    }
    return months.filter(month => month === selectedMonth);
  }, [selectedMonth]);

  // Carousel navigation functions
  const nextMonth = () => {
    setCurrentMonthIndex((prev) => (prev + 1) % months.length);
    setSelectedMonth(months[(currentMonthIndex + 1) % months.length]);
  };

  const prevMonth = () => {
    setCurrentMonthIndex((prev) => (prev - 1 + months.length) % months.length);
    setSelectedMonth(months[(currentMonthIndex - 1 + months.length) % months.length]);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.part-dropdown-container')) {
        setShowPartDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Generate chart data untuk setiap bulan
  const generateMonthlyChartData = (monthName: string) => {
    const monthSchedules = filteredSchedules.filter(schedule => {
      const scheduleName = schedule.name || "";
      return scheduleName.includes(monthName);
    });

    if (monthSchedules.length === 0) {
      return [];
    }

    // Tentukan jumlah hari dalam bulan
    const getDaysInMonth = (month: string) => {
      const monthMap: { [key: string]: number } = {
        "Januari": 31, "Februari": 28, "Maret": 31, "April": 30,
        "Mei": 31, "Juni": 30, "Juli": 31, "Agustus": 31,
        "September": 30, "Oktober": 31, "November": 30, "Desember": 31
      };
      return monthMap[month] || 31;
    };

    const daysInMonth = getDaysInMonth(monthName);

    // Gabungkan semua schedule items dari bulan tersebut dan group by day
    const dayData: { [key: number]: { rencana: number; actual: number } } = {};

    // Initialize semua hari dengan 0
    for (let day = 1; day <= daysInMonth; day++) {
      dayData[day] = { rencana: 0, actual: 0 };
    }

    // Aggregate data per hari
    monthSchedules.forEach(schedule => {
      schedule.schedule.forEach(item => {
        if (item.day >= 1 && item.day <= daysInMonth) {
          dayData[item.day].rencana += item.planningHour || 0;
          dayData[item.day].actual += item.jamProduksiAktual || 0;
        }
      });
    });

    // Convert ke array dan urutkan berdasarkan hari
    return Object.keys(dayData).map(dayStr => {
      const day = parseInt(dayStr);
      return {
        day: day.toString(),
        rencanaJamProduksi: dayData[day].rencana,
        actualJamProduksi: dayData[day].actual,
        originalDay: day
      };
    }).sort((a, b) => a.originalDay - b.originalDay);
  };

  console.log("AllChartsPage - savedSchedules:", savedSchedules);
  console.log("AllChartsPage - filteredSchedules:", filteredSchedules);

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
              Semua Chart Jam Produksi
            </h1>
          </div>
          <p className={`text-lg ${uiColors.text.secondary}`}>
            Detail perbandingan rencana dan actual jam produksi per bulan dengan breakdown per hari
          </p>
        </div>

        {/* Filter Section */}
        <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Part Filter */}
            <div>
              <label className={`block mb-2 text-sm font-medium ${uiColors.text.primary}`}>
                Pilih Part:
              </label>
              <div className="relative part-dropdown-container">
                <input
                  type="text"
                  value={searchPart}
                  onChange={handleSearchPartChange}
                  onFocus={() => setShowPartDropdown(true)}
                  placeholder={selectedPart || "Cari part..."}
                  className={`${uiColors.bg.secondary} ${uiColors.text.primary} border ${uiColors.border.secondary} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm w-full`}
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
                          className={`${uiColors.text.primary} hover:${uiColors.bg.tertiary} px-4 py-2 text-sm w-full text-left ${selectedPart === part ? 'bg-purple-100 dark:bg-purple-900' : ''}`}
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
              {selectedPart && (
                <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      Menampilkan data untuk <strong>{selectedPart}</strong>
                    </span>
                  </div>
                </div>
              )}
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
                  className={`${uiColors.bg.secondary} ${uiColors.text.primary} border ${uiColors.border.secondary} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm w-full appearance-none pr-8`}
                >
                  <option value="">Semua Bulan</option>
                  {months.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {selectedMonth && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      Menampilkan data untuk <strong>{selectedMonth}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="min-h-screen">
          {filteredMonths.map((month) => {
           const chartData = generateMonthlyChartData(month);
           const hasData = chartData.length > 0;

           return (
             <div key={month} className={`${uiColors.bg.secondary} rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 min-h-screen`}>
               {/* Month Header with Carousel Navigation */}
               <div className="mb-6">
                 <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-4">
                     <button
                       onClick={prevMonth}
                       className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                       disabled={currentMonthIndex === 0}
                     >
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                       </svg>
                     </button>
                     <h2 className={`text-3xl font-bold ${uiColors.text.accent}`}>
                       {month}
                     </h2>
                     <button
                       onClick={nextMonth}
                       className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                       disabled={currentMonthIndex === months.length - 1}
                     >
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                       </svg>
                     </button>
                   </div>
                   <div className="text-sm text-gray-500">
                     {currentMonthIndex + 1} dari {months.length}
                   </div>
                 </div>
                 <p className={`text-lg ${uiColors.text.secondary}`}>
                   {selectedPart 
                     ? `Perbandingan Rencana dan Actual Jam Produksi - ${selectedPart} (Per Hari)`
                     : "Perbandingan Rencana dan Actual Jam Produksi (Per Hari)"
                   }
                 </p>
               </div>

                                {hasData ? (
                   <div className="h-[calc(100vh-400px)] min-h-[500px]">
                     <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
                         margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
                       <CartesianGrid
                         strokeDasharray="3 3"
                         stroke={uiColors.bg.primary === "bg-gray-50" ? "#e5e7eb" : "#374151"}
                       />
            <XAxis
              dataKey="day"
                           stroke={uiColors.bg.primary === "bg-gray-50" ? "#6b7280" : "#9ca3af"}
                           angle={0}
                           textAnchor="middle"
                           height={60}
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
                         formatter={(value: any, name: string) => [
                           `${value} jam`,
                           name === "rencanaJamProduksi" ? "Rencana Jam Produksi" : "Actual Jam Produksi"
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
      </div>
                                ) : (
                   <div className="h-[calc(100vh-400px)] min-h-[500px] flex items-center justify-center">
                     <div className="text-center">
                       <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                       </svg>
                       <p className={`text-lg ${uiColors.text.tertiary} mb-2`}>
                         Tidak ada data untuk {month}
                       </p>
                       <p className={`text-sm ${uiColors.text.tertiary}`}>
                         {selectedPart 
                           ? `Belum ada jadwal produksi untuk ${selectedPart} di bulan ${month}`
                           : `Belum ada jadwal produksi di bulan ${month}`
                         }
                       </p>
                     </div>
                   </div>
                 )}

               {/* Summary untuk bulan ini */}
               {hasData && (
                 <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                     <div>
                       <span className={`font-medium ${uiColors.text.primary}`}>Total Rencana:</span>
                       <span className={`ml-2 ${uiColors.text.secondary}`}>
                         {chartData.reduce((sum, item) => sum + item.rencanaJamProduksi, 0).toFixed(1)} jam
                       </span>
                     </div>
                     <div>
                       <span className={`font-medium ${uiColors.text.primary}`}>Total Actual:</span>
                       <span className={`ml-2 ${uiColors.text.secondary}`}>
                         {chartData.reduce((sum, item) => sum + item.actualJamProduksi, 0).toFixed(1)} jam
                       </span>
                     </div>
                     <div>
                       <span className={`font-medium ${uiColors.text.primary}`}>Jumlah Hari:</span>
                       <span className={`ml-2 ${uiColors.text.secondary}`}>
                         {chartData.length} hari
                       </span>
            </div>
          </div>
        </div>
               )}

                               {/* Tabel Summary per Part */}
                {hasData && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-lg font-semibold ${uiColors.text.accent}`}>
                        Ringkasan Perbandingan - {month}
                      </h3>
      </div>

                    <div className={`overflow-x-auto ${uiColors.bg.secondary} rounded-xl border border-gray-200 dark:border-gray-700`}>
                      <table className="w-full">
                        <thead>
                          <tr className={`${uiColors.bg.tertiary}`}>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${uiColors.text.primary} uppercase tracking-wider`}>
                              HARI
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${uiColors.text.primary} uppercase tracking-wider`}>
                              RENCANA (JAM)
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${uiColors.text.primary} uppercase tracking-wider`}>
                              ACTUAL (JAM)
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${uiColors.text.primary} uppercase tracking-wider`}>
                              GAP
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${uiColors.text.primary} uppercase tracking-wider`}>
                              ACHIEVEMENT (%)
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${uiColors.border.secondary}`}>
                          {/* Detail per hari */}
                          {chartData.map((item, index) => {
                            const dailyGap = item.rencanaJamProduksi - item.actualJamProduksi;
                            const dailyAchievement = item.rencanaJamProduksi > 0 ? ((item.actualJamProduksi / item.rencanaJamProduksi) * 100) : 0;
                            
                            return (
                              <tr key={index} className={`${uiColors.bg.secondary} hover:${uiColors.bg.tertiary}`}>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${uiColors.text.primary}`}>
                                  Hari {item.day}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${uiColors.text.primary}`}>
                                  {item.rencanaJamProduksi.toFixed(1)} jam
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${uiColors.text.primary}`}>
                                  {item.actualJamProduksi.toFixed(1)} jam
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${dailyGap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {dailyGap >= 0 ? '+' : ''}{dailyGap.toFixed(1)} jam
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${dailyAchievement >= 100 ? 'text-green-600' : dailyAchievement >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {dailyAchievement.toFixed(1)}%
                                </td>
                              </tr>
                            );
                          })}
                          
                          {/* Baris akumulasi di paling bawah */}
                          {(() => {
                            const totalRencanaJam = chartData.reduce((sum, item) => sum + item.rencanaJamProduksi, 0);
                            const totalActualJam = chartData.reduce((sum, item) => sum + item.actualJamProduksi, 0);
                            const gap = totalRencanaJam - totalActualJam;
                            const achievement = totalRencanaJam > 0 ? ((totalActualJam / totalRencanaJam) * 100) : 0;
                            
                            return (
                              <tr className={`${uiColors.bg.tertiary} font-bold border-t-2 border-gray-400`}>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${uiColors.text.accent}`}>
                                  Total Akumulasi
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${uiColors.text.accent}`}>
                                  {totalRencanaJam.toFixed(1)} jam
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${uiColors.text.accent}`}>
                                  {totalActualJam.toFixed(1)} jam
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {gap >= 0 ? '+' : ''}{gap.toFixed(1)} jam
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${achievement >= 100 ? 'text-green-600' : achievement >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {achievement.toFixed(1)}%
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
        </div>
        </div>
      )}
             </div>
           );
         })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className={`text-sm ${uiColors.text.tertiary}`}>
            Menampilkan detail perbandingan jam produksi untuk semua bulan dalam setahun
          </p>
        </div>
      </div>
    </div>
  );
};

export default AllChartsPage;
