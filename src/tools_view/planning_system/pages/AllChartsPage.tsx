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
      <div key={index} className="bg-gray-900 rounded-xl p-4 h-80">
        <h3 className="text-xl font-semibold text-white mb-2">{name}</h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="day"
              stroke="#9ca3af"
              interval={2}
              tick={{ fontSize: 12 }}
            />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "0.5rem",
                color: "#f9fafb",
              }}
              labelStyle={{ color: "#f9fafb" }}
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
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Semua Chart Produksi</h1>
        <div className="flex items-center space-x-4">
          <label htmlFor="partSelect" className="text-white">
            Pilih Part:
          </label>
          <select
            id="partSelect"
            value={selectedPart}
            onChange={handlePartChange}
            className="bg-gray-800 text-white border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {partOptions.map((part) => (
              <option key={part} value={part}>
                {part}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredSchedules.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-8 text-center">
          <p className="text-gray-400">
            Belum ada jadwal produksi untuk part ini
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
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
