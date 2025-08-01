import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { useSchedule } from "../contexts/ScheduleContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getChartThemeColors,
  getBarChartColors,
} from "../utils/chartThemeUtils";
import "../styles/dropdown.css";

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
}

interface SavedSchedule {
  id: string;
  name: string;
  date: string;
  form: any;
  schedule: ScheduleItem[];
}

interface AllChartsPageProps {
  savedSchedules: SavedSchedule[];
  setCurrentView: (
    view: "dashboard" | "scheduler" | "saved" | "allcharts",
  ) => void;
}

// Data part dari mockData
const partOptions = ["29N Muffler", "Transmission Case B2", "Brake Disc C3"];

const AllChartsPage: React.FC = () => {
  const { savedSchedules } = useSchedule();
  const { theme } = useTheme();
  const [selectedPart, setSelectedPart] = useState<string>(
    partOptions.length > 0 ? partOptions[0] : "",
  );

  // Mendapatkan semua schedule untuk part yang dipilih
  const filteredSchedules = React.useMemo(() => {
    return savedSchedules.filter(
      (schedule) => schedule.form && schedule.form.part === selectedPart,
    );
  }, [savedSchedules, selectedPart]);

  // Handler untuk perubahan part
  const handlePartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPart(e.target.value);
  };

  // Mendapatkan warna berdasarkan theme
  const colors = getChartThemeColors(theme);
  const barColors = getBarChartColors(theme);

  // Fungsi untuk mengolah data chart
  const processChartData = (schedule: ScheduleItem[]) => {
    // Mengelompokkan data berdasarkan hari
    const groupedByDay = schedule.reduce<
      Record<number, { akumulasiDelivery: number }>
    >((acc, item) => {
      if (!acc[item.day]) {
        acc[item.day] = { akumulasiDelivery: 0 };
      }

      acc[item.day].akumulasiDelivery += item.delivery || 0;
      return acc;
    }, {});

    // Menghitung akumulasi pengiriman
    let runningTotal = 0;
    const days = Object.keys(groupedByDay).sort(
      (a, b) => parseInt(a) - parseInt(b),
    );

    const result = days.map((day) => {
      const dayNum = parseInt(day);
      runningTotal += groupedByDay[dayNum].akumulasiDelivery;

      // Buat tanggal untuk tooltip
      const currentDate = new Date();
      const scheduleDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        dayNum,
      );
      const formattedDate = scheduleDate.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      return {
        day: dayNum.toString(),
        dayLabel: `Hari ${day}`,
        akumulasiDelivery: runningTotal,
        fullDate: formattedDate,
      };
    });

    return result;
  };

  // Fungsi untuk membuat chart dengan data yang sudah diolah
  const renderChart = (name: string, chartData: any[], index: number) => {
    return (
      <div
        key={index}
        className={`${colors.cardBg} rounded-xl p-3 sm:p-4 h-64 sm:h-80 shadow-lg border ${colors.borderColor}`}
      >
        <h3
          className={`text-lg sm:text-xl font-semibold ${colors.titleText} mb-2`}
        >
          {name}
        </h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
            <XAxis
              dataKey="day"
              stroke={colors.axisColor}
              interval={2}
              tick={{ fontSize: 12 }}
            />
            <YAxis stroke={colors.axisColor} />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.tooltipBg,
                border: `1px solid ${colors.tooltipBorder}`,
                borderRadius: "0.5rem",
                color: colors.tooltipText,
              }}
              labelStyle={{ color: colors.labelTextColor }}
              formatter={(value, name, props) => [`${value} PCS`, name]}
              labelFormatter={(label) => {
                const dataPoint = chartData.find((item) => item.day === label);
                return dataPoint ? dataPoint.fullDate : `Hari ${label}`;
              }}
            />
            <Legend />
            <Bar
              dataKey="akumulasiDelivery"
              name="Akumulasi Delivery"
              fill={barColors.barFill}
              radius={barColors.barRadius}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${colors.pageBg} p-4 sm:p-8`}>
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <h1
          className={`text-2xl sm:text-3xl font-bold ${colors.titleText} mb-4 sm:mb-6`}
        >
          Semua Chart Produksi
        </h1>

        {/* Part Selection - Responsive Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
          <label
            htmlFor="partSelect"
            className={`${colors.labelText} text-sm sm:text-base font-medium`}
          >
            Pilih Part:
          </label>
          <div className="relative w-full sm:w-auto max-w-xs sm:max-w-none">
            <select
              id="partSelect"
              value={selectedPart}
              onChange={handlePartChange}
              data-theme={theme}
              className={`${colors.selectBg} ${colors.selectText} border ${colors.selectBorder} rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${colors.selectFocusRing} text-sm sm:text-base w-full sm:w-auto min-w-[200px] appearance-none pr-8 relative z-10`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 0.5rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.5em 1.5em",
              }}
            >
              {partOptions.map((part) => (
                <option key={part} value={part}>
                  {part}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredSchedules.length === 0 ? (
        <div
          className={`${colors.emptyStateBg} rounded-xl p-6 sm:p-8 text-center shadow-lg border ${colors.borderColor}`}
        >
          <p className={`${colors.emptyStateText} text-sm sm:text-base`}>
            Belum ada jadwal produksi untuk part ini
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {filteredSchedules.map((savedSchedule, index) => {
            const chartData = processChartData(savedSchedule.schedule);
            return renderChart(savedSchedule.name, chartData, index);
          })}
        </div>
      )}
    </div>
  );
};

export default AllChartsPage;
