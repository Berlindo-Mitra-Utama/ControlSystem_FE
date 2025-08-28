import React, { useState, useEffect } from "react";
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
  Legend,
} from "recharts";

const AllChartsPage: React.FC = () => {
  const navigate = useNavigate();
  const { savedSchedules } = useSchedule();
  const { uiColors } = useTheme();

  // Data part yang tersedia (dinamis dari savedSchedules)
  const partOptions = React.useMemo(() => {
    const parts = new Set<string>();
    savedSchedules.forEach((s) => {
      const p = s?.form?.part;
      if (p && typeof p === "string" && p.trim().length > 0) {
        parts.add(p);
      }
    });
    return Array.from(parts).sort((a, b) => a.localeCompare(b));
  }, [savedSchedules]);

  // Daftar bulan
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

  // Get current date for default values
  const currentDate = new Date();
  const currentMonthName = months[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  // State untuk filter
  const [selectedPart, setSelectedPart] = useState<string>("");
  const [searchPart, setSearchPart] = useState<string>("");
  const [showPartDropdown, setShowPartDropdown] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthName);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(
    currentDate.getMonth(),
  );

  // Filter part berdasarkan pencarian
  const filteredPartOptions = partOptions.filter((part) => {
    const partNoSpaces = part.toLowerCase().replace(/\s+/g, "");
    const searchNoSpaces = searchPart.toLowerCase().replace(/\s+/g, "");
    return partNoSpaces.includes(searchNoSpaces);
  });

  // Mendapatkan semua schedule untuk part yang dipilih
  const filteredSchedules = React.useMemo(() => {
    let filtered = [...savedSchedules];

    if (selectedPart) {
      filtered = filtered.filter(
        (schedule) => schedule.form && schedule.form.part === selectedPart,
      );
    }

    return filtered;
  }, [savedSchedules, selectedPart]);

  // Filter bulan yang akan ditampilkan
  const filteredMonths = React.useMemo(() => {
    if (!selectedMonth) {
      return months;
    }
    return [selectedMonth];
  }, [selectedMonth]);

  // Calendar navigation functions
  const nextMonth = () => {
    const currentIndex = months.indexOf(selectedMonth);
    if (currentIndex === 11) {
      // December -> January next year
      setSelectedMonth("Januari");
      setSelectedYear((prev) => prev + 1);
      setCurrentMonthIndex(0);
    } else {
      // Next month same year
      const nextIndex = currentIndex + 1;
      setSelectedMonth(months[nextIndex]);
      setCurrentMonthIndex(nextIndex);
    }
  };

  const prevMonth = () => {
    const currentIndex = months.indexOf(selectedMonth);
    if (currentIndex === 0) {
      // January -> December previous year
      setSelectedMonth("Desember");
      setSelectedYear((prev) => prev - 1);
      setCurrentMonthIndex(11);
    } else {
      // Previous month same year
      const prevIndex = currentIndex - 1;
      setSelectedMonth(months[prevIndex]);
      setCurrentMonthIndex(prevIndex);
    }
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
      if (!target.closest(".part-dropdown-container")) {
        setShowPartDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Generate chart data untuk setiap bulan
  const generateMonthlyChartData = (monthName: string) => {
    const monthSchedules = filteredSchedules.filter((schedule) => {
      const scheduleName = schedule.name || "";
      // Filter by both month and year
      return (
        scheduleName.includes(monthName) &&
        scheduleName.includes(selectedYear.toString())
      );
    });

    if (monthSchedules.length === 0) {
      return [];
    }

    // Tentukan jumlah hari dalam bulan dengan kalkulasi real-time
    const getDaysInMonth = (month: string, year: number) => {
      const monthIndex = months.indexOf(month);
      return new Date(year, monthIndex + 1, 0).getDate();
    };

    const daysInMonth = getDaysInMonth(monthName, selectedYear);

    // Gabungkan semua schedule items dari bulan tersebut dan group by day
    const dayData: { [key: number]: { rencana: number; actual: number } } = {};

    // Initialize semua hari dengan 0
    for (let day = 1; day <= daysInMonth; day++) {
      dayData[day] = { rencana: 0, actual: 0 };
    }

    // Aggregate data per hari
    monthSchedules.forEach((schedule) => {
      schedule.schedule.forEach((item) => {
        if (item.day >= 1 && item.day <= daysInMonth) {
          dayData[item.day].rencana += item.planningHour || 0;
          dayData[item.day].actual += item.jamProduksiAktual || 0;
        }
      });
    });

    // Convert ke array dan urutkan berdasarkan hari
    return Object.keys(dayData)
      .map((dayStr) => {
        const day = parseInt(dayStr);
        return {
          day: day.toString(),
          rencanaJamProduksi: dayData[day].rencana,
          actualJamProduksi: dayData[day].actual,
          originalDay: day,
        };
      })
      .sort((a, b) => a.originalDay - b.originalDay);
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
              <svg
                className="w-6 h-6"
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
            <h1 className={`text-3xl font-bold ${uiColors.text.accent}`}>
              Semua Chart Jam Produksi
            </h1>
          </div>
          <p className={`text-lg ${uiColors.text.secondary}`}>
            Detail perbandingan rencana dan actual jam produksi per bulan dengan
            breakdown per hari
          </p>
        </div>

        {/* Filter Section */}
        <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Part Filter */}
            <div>
              <label
                className={`block mb-2 text-sm font-medium ${uiColors.text.primary}`}
              >
                Pilih Part:
              </label>
              <div className="relative part-dropdown-container">
                <input
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
                          className={`${uiColors.text.primary} hover:${uiColors.bg.tertiary} px-4 py-2 text-sm w-full text-left ${selectedPart === part ? "bg-blue-100 dark:bg-blue-900" : ""}`}
                        >
                          {part}
                        </button>
                      ))}
                      {filteredPartOptions.length === 0 && (
                        <div
                          className={`${uiColors.text.tertiary} px-4 py-2 text-sm italic`}
                        >
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
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
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
              <label
                className={`block mb-2 text-sm font-medium ${uiColors.text.primary}`}
              >
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
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
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
                    {Array.from(
                      { length: 10 },
                      (_, i) => currentYear - 5 + i,
                    ).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              {selectedMonth && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      Menampilkan data untuk{" "}
                      <strong>
                        {selectedMonth} {selectedYear}
                      </strong>{" "}
                      (
                      {new Date(
                        selectedYear,
                        months.indexOf(selectedMonth) + 1,
                        0,
                      ).getDate()}{" "}
                      hari)
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
            const chartData = generateMonthlyChartData(month);
            const hasData = chartData.length > 0;

            return (
              <div
                key={month}
                className={`${uiColors.bg.secondary} rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700`}
              >
                {/* Month Header with Carousel Navigation */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={prevMonth}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={
                        selectedYear <= currentYear - 5 &&
                        months.indexOf(selectedMonth) === 0
                      }
                    >
                      <svg
                        className="w-6 h-6"
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
                      <h2
                        className={`text-3xl font-bold ${uiColors.text.accent}`}
                      >
                        {month} {selectedYear}
                      </h2>
                      <div className="mt-1 text-sm text-gray-500">
                        {new Date(
                          selectedYear,
                          months.indexOf(month) + 1,
                          0,
                        ).getDate()}{" "}
                        hari
                      </div>
                    </div>

                    <button
                      onClick={nextMonth}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={
                        selectedYear >= currentYear + 4 &&
                        months.indexOf(selectedMonth) === 11
                      }
                    >
                      <svg
                        className="w-6 h-6"
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
                  <p className={`text-lg ${uiColors.text.secondary}`}>
                    {selectedPart
                      ? `Perbandingan Rencana dan Actual Jam Produksi - ${selectedPart} (Per Hari)`
                      : "Perbandingan Rencana dan Actual Jam Produksi (Per Hari)"}
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
                            stroke={
                              uiColors.bg.primary === "bg-gray-50"
                                ? "#e5e7eb"
                                : "#374151"
                            }
                          />
                          <XAxis
                            dataKey="day"
                            stroke={
                              uiColors.bg.primary === "bg-gray-50"
                                ? "#6b7280"
                                : "#9ca3af"
                            }
                            angle={0}
                            textAnchor="middle"
                            height={60}
                          />
                          <YAxis
                            stroke={
                              uiColors.bg.primary === "bg-gray-50"
                                ? "#6b7280"
                                : "#9ca3af"
                            }
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor:
                                uiColors.bg.primary === "bg-gray-50"
                                  ? "#ffffff"
                                  : "#1f2937",
                              border: `1px solid ${uiColors.bg.primary === "bg-gray-50" ? "#d1d5db" : "#374151"}`,
                              borderRadius: "0.5rem",
                              color:
                                uiColors.bg.primary === "bg-gray-50"
                                  ? "#111827"
                                  : "#f9fafb",
                            }}
                            labelStyle={{
                              color:
                                uiColors.bg.primary === "bg-gray-50"
                                  ? "#111827"
                                  : "#f9fafb",
                            }}
                            formatter={(value: any, name: string) => [
                              `${value} jam`,
                              name === "rencanaJamProduksi"
                                ? "Rencana Jam Produksi"
                                : "Actual Jam Produksi",
                            ]}
                          />
                          <Legend />
                          <Bar
                            dataKey="rencanaJamProduksi"
                            name="Rencana Jam Produksi"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="actualJamProduksi"
                            name="Actual Jam Produksi"
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
                      <svg
                        className="w-16 h-16 mx-auto text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <p className={`text-lg ${uiColors.text.tertiary} mb-2`}>
                        Tidak ada data untuk {month}
                      </p>
                      <p className={`text-sm ${uiColors.text.tertiary}`}>
                        {selectedPart
                          ? `Belum ada jadwal produksi untuk ${selectedPart} di bulan ${month}`
                          : `Belum ada jadwal produksi di bulan ${month}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tabel Summary per Part */}
                {hasData && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className={`text-lg font-semibold ${uiColors.text.accent}`}
                      >
                        Ringkasan Perbandingan - {month}
                      </h3>
                    </div>

                    <div
                      className={`overflow-x-auto ${uiColors.bg.secondary} rounded-xl border border-gray-200 dark:border-gray-700`}
                    >
                      <table className="w-full">
                        <thead>
                          <tr className={`${uiColors.bg.tertiary}`}>
                            <th
                              className={`px-6 py-3 text-left text-xs font-medium ${uiColors.text.primary} uppercase tracking-wider`}
                            >
                              HARI
                            </th>
                            <th
                              className={`px-6 py-3 text-left text-xs font-medium ${uiColors.text.primary} uppercase tracking-wider`}
                            >
                              RENCANA (JAM)
                            </th>
                            <th
                              className={`px-6 py-3 text-left text-xs font-medium ${uiColors.text.primary} uppercase tracking-wider`}
                            >
                              ACTUAL (JAM)
                            </th>
                            <th
                              className={`px-6 py-3 text-left text-xs font-medium ${uiColors.text.primary} uppercase tracking-wider`}
                            >
                              GAP
                            </th>
                            <th
                              className={`px-6 py-3 text-left text-xs font-medium ${uiColors.text.primary} uppercase tracking-wider`}
                            >
                              ACHIEVEMENT (%)
                            </th>
                          </tr>
                        </thead>
                        <tbody
                          className={`divide-y ${uiColors.border.secondary}`}
                        >
                          {/* Detail per hari */}
                          {chartData.map((item, index) => {
                            const dailyGap =
                              item.rencanaJamProduksi - item.actualJamProduksi;
                            const dailyAchievement =
                              item.rencanaJamProduksi > 0
                                ? (item.actualJamProduksi /
                                    item.rencanaJamProduksi) *
                                  100
                                : 0;

                            return (
                              <tr
                                key={index}
                                className={`${uiColors.bg.secondary} hover:${uiColors.bg.tertiary}`}
                              >
                                <td
                                  className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${uiColors.text.primary}`}
                                >
                                  Hari {item.day}
                                </td>
                                <td
                                  className={`px-6 py-4 whitespace-nowrap text-sm ${uiColors.text.primary}`}
                                >
                                  {item.rencanaJamProduksi.toFixed(1)} jam
                                </td>
                                <td
                                  className={`px-6 py-4 whitespace-nowrap text-sm ${uiColors.text.primary}`}
                                >
                                  {item.actualJamProduksi.toFixed(1)} jam
                                </td>
                                <td
                                  className={`px-6 py-4 whitespace-nowrap text-sm ${dailyGap >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {dailyGap >= 0 ? "+" : ""}
                                  {dailyGap.toFixed(1)} jam
                                </td>
                                <td
                                  className={`px-6 py-4 whitespace-nowrap text-sm ${dailyAchievement >= 100 ? "text-green-600" : dailyAchievement >= 80 ? "text-yellow-600" : "text-red-600"}`}
                                >
                                  {dailyAchievement.toFixed(1)}%
                                </td>
                              </tr>
                            );
                          })}

                          {/* Baris akumulasi di paling bawah */}
                          {(() => {
                            const totalRencanaJam = chartData.reduce(
                              (sum, item) => sum + item.rencanaJamProduksi,
                              0,
                            );
                            const totalActualJam = chartData.reduce(
                              (sum, item) => sum + item.actualJamProduksi,
                              0,
                            );
                            const gap = totalRencanaJam - totalActualJam;
                            const achievement =
                              totalRencanaJam > 0
                                ? (totalActualJam / totalRencanaJam) * 100
                                : 0;

                            return (
                              <tr
                                key="total"
                                className={`${uiColors.bg.tertiary} font-bold border-t-2 border-gray-400`}
                              >
                                <td
                                  className={`px-6 py-4 whitespace-nowrap text-sm ${uiColors.text.accent}`}
                                >
                                  Total Akumulasi
                                </td>
                                <td
                                  className={`px-6 py-4 whitespace-nowrap text-sm ${uiColors.text.accent}`}
                                >
                                  {totalRencanaJam.toFixed(1)} jam
                                </td>
                                <td
                                  className={`px-6 py-4 whitespace-nowrap text-sm ${uiColors.text.accent}`}
                                >
                                  {totalActualJam.toFixed(1)} jam
                                </td>
                                <td
                                  className={`px-6 py-4 whitespace-nowrap text-sm ${gap >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {gap >= 0 ? "+" : ""}
                                  {gap.toFixed(1)} jam
                                </td>
                                <td
                                  className={`px-6 py-4 whitespace-nowrap text-sm ${achievement >= 100 ? "text-green-600" : achievement >= 80 ? "text-yellow-600" : "text-red-600"}`}
                                >
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
      </div>
    </div>
  );
};

export default AllChartsPage;
