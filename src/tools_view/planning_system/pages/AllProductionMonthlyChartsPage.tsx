import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSchedule } from "../contexts/ScheduleContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

const AllProductionMonthlyChartsPage: React.FC = () => {
  const navigate = useNavigate();
  const { savedSchedules } = useSchedule();
  const { uiColors } = useTheme();

  // Part options (consistent with other pages)
  const partOptions = [
    "29N Muffler",
    "Transmission Case B2",
    "Brake Disc C3",
    "Engine Block A7",
    "Cylinder Head X5",
  ];

  // Month list
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // Defaults (current month/year)
  const currentDate = new Date();
  const currentMonthName = months[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  // Filters state
  const [selectedPart, setSelectedPart] = useState<string>("");
  const [searchPart, setSearchPart] = useState<string>("");
  const [showPartDropdown, setShowPartDropdown] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthName);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(currentDate.getMonth());

  // Part search filter
  const filteredPartOptions = partOptions.filter(part => {
    const partNoSpaces = part.toLowerCase().replace(/\s+/g, "");
    const searchNoSpaces = searchPart.toLowerCase().replace(/\s+/g, "");
    return partNoSpaces.includes(searchNoSpaces);
  });

  // Derived schedules: filter by part if selected
  const filteredSchedules = useMemo(() => {
    let filtered = [...savedSchedules];
    if (selectedPart) {
      filtered = filtered.filter(
        (schedule) => schedule.form && schedule.form.part === selectedPart
      );
    }
    return filtered;
  }, [savedSchedules, selectedPart]);

  // Only show the selected month
  const filteredMonths = useMemo(() => {
    if (!selectedMonth) return months;
    return [selectedMonth];
  }, [selectedMonth]);

  // Month navigation
  const nextMonth = () => {
    const idx = months.indexOf(selectedMonth);
    if (idx === 11) {
      setSelectedMonth("Januari");
      setSelectedYear(prev => prev + 1);
      setCurrentMonthIndex(0);
    } else {
      const nextIdx = idx + 1;
      setSelectedMonth(months[nextIdx]);
      setCurrentMonthIndex(nextIdx);
    }
  };

  const prevMonth = () => {
    const idx = months.indexOf(selectedMonth);
    if (idx === 0) {
      setSelectedMonth("Desember");
      setSelectedYear(prev => prev - 1);
      setCurrentMonthIndex(11);
    } else {
      const prevIdx = idx - 1;
      setSelectedMonth(months[prevIdx]);
      setCurrentMonthIndex(prevIdx);
    }
  };

  // Dropdown outside click close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.part-dropdown-container')) {
        setShowPartDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Realtime days in month
  const getDaysInMonth = (month: string, year: number) => {
    const monthIndex = months.indexOf(month);
    return new Date(year, monthIndex + 1, 0).getDate();
  };

  // Build daily produksi chart data for selected month/year
  // rencanaProduksi: sum of planningPcs
  // actualProduksi: sum of hasilProduksi
  const generateMonthlyProductionData = (monthName: string) => {
    // Filter schedules by month and year from schedule.name e.g. "Agustus 2024"
    const monthSchedules = filteredSchedules.filter(schedule => {
      const scheduleName = schedule.name || "";
      return scheduleName.includes(monthName) && scheduleName.includes(selectedYear.toString());
    });

    if (monthSchedules.length === 0) {
      return [];
    }

    const daysInMonth = getDaysInMonth(monthName, selectedYear);

    // Initialize all days
    const dayData: { [key: number]: { rencana: number; actual: number } } = {};
    for (let day = 1; day <= daysInMonth; day++) {
      dayData[day] = { rencana: 0, actual: 0 };
    }

    // Aggregate per day
    monthSchedules.forEach(schedule => {
      schedule.schedule.forEach((item: any) => {
        if (item.day >= 1 && item.day <= daysInMonth) {
          dayData[item.day].rencana += item?.planningPcs ?? 0;
          dayData[item.day].actual += item?.hasilProduksi ?? 0;
        }
      });
    });

    return Object.keys(dayData).map(dayStr => {
      const day = parseInt(dayStr);
      return {
        day: day.toString(),
        rencanaProduksi: dayData[day].rencana,
        actualProduksi: dayData[day].actual,
        originalDay: day
      };
    }).sort((a, b) => a.originalDay - b.originalDay);
  };

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
              Perbandingan Rencana dan Actual Produksi (Per Hari)
            </h1>
          </div>
          <p className={`text-lg ${uiColors.text.secondary}`}>
            Per hari untuk bulan dan tahun yang dipilih. Pilih part untuk memfilter data.
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
                  onChange={(e) => { setSearchPart(e.target.value); setShowPartDropdown(true); }}
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
                        onClick={() => { setSelectedPart(""); setSearchPart(""); setShowPartDropdown(false); }}
                        className={`${uiColors.text.primary} hover:${uiColors.bg.tertiary} px-4 py-2 text-sm w-full text-left`}
                      >
                        Semua Part
                      </button>
                      {filteredPartOptions.map((part) => (
                        <button
                          key={part}
                          onClick={() => { setSelectedPart(part); setSearchPart(""); setShowPartDropdown(false); }}
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
              {selectedPart && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
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

            {/* Month and Year Filter */}
            <div>
              <label className={`block mb-2 text-sm font-medium ${uiColors.text.primary}`}>
                Pilih Bulan dan Tahun:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Month Selector */}
                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setCurrentMonthIndex(months.indexOf(e.target.value));
                    }}
                    className={`${uiColors.bg.secondary} ${uiColors.text.primary} border ${uiColors.border.secondary} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full appearance-none pr-8`}
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

                {/* Year Selector */}
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className={`${uiColors.bg.secondary} ${uiColors.text.primary} border ${uiColors.border.secondary} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full appearance-none pr-8`}
                  >
                    {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map((year) => (
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
              {selectedMonth && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      Menampilkan data untuk <strong>{selectedMonth} {selectedYear}</strong> ({new Date(selectedYear, months.indexOf(selectedMonth) + 1, 0).getDate()} hari)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-8">
          {filteredMonths.map((month) => {
            const chartData = generateMonthlyProductionData(month);
            const hasData = chartData.length > 0;

            return (
              <div key={month} className={`${uiColors.bg.secondary} rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700`}>
                {/* Month Header with Carousel Navigation */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={prevMonth}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <div className="text-center">
                      <h2 className={`text-3xl font-bold ${uiColors.text.accent}`}>
                        {month} {selectedYear}
                      </h2>
                      <div className="mt-1 text-sm text-gray-500">
                        {new Date(selectedYear, months.indexOf(month) + 1, 0).getDate()} hari
                      </div>
                    </div>

                    <button
                      onClick={nextMonth}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  <p className={`text-lg ${uiColors.text.secondary}`}>
                    {selectedPart
                      ? `Perbandingan Rencana dan Actual Produksi - ${selectedPart} (Per Hari)`
                      : "Perbandingan Rencana dan Actual Produksi (Per Hari)"}
                  </p>
                </div>

                {hasData ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="h-[500px]">
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
                              `${value} pcs`,
                              name === "rencanaProduksi" ? "Rencana Produksi" : "Actual Produksi"
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
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className={`text-lg ${uiColors.text.tertiary} mb-2`}>
                        Tidak ada data untuk {month} {selectedYear}
                      </p>
                      <p className={`text-sm ${uiColors.text.tertiary}`}>
                        {selectedPart
                          ? `Belum ada data produksi untuk ${selectedPart} di bulan ${month} ${selectedYear}`
                          : `Belum ada data produksi di bulan ${month} ${selectedYear}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AllProductionMonthlyChartsPage;
