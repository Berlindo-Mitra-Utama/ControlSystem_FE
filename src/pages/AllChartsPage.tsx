import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

const AllChartsPage: React.FC<AllChartsPageProps> = ({
  savedSchedules,
  setCurrentView,
}) => {
  // Fungsi untuk mengolah data chart
  const processChartData = (schedule: ScheduleItem[]) => {
    // Mengelompokkan data berdasarkan hari
    const groupedByDay = schedule.reduce<
      Record<number, { target: number; actual: number }>
    >((acc, item) => {
      if (!acc[item.day]) {
        acc[item.day] = { target: 0, actual: 0 };
      }
      acc[item.day].target += item.pcs;
      acc[item.day].actual += item.actualPcs || 0;
      return acc;
    }, {});

    // Mengubah ke format array untuk recharts
    return Object.entries(groupedByDay).map(([day, data]) => ({
      day: `Hari ${day}`,
      target: data.target,
      actual: data.actual,
    }));
  };

  // Fungsi untuk membuat chart dengan data yang sudah diolah
  const renderChart = (name: string, chartData: any[], index: number) => {
    // Jika data terlalu panjang, kelompokkan per 3 hari
    const processedData =
      chartData.length > 10
        ? chartData.reduce((acc, item, idx) => {
            const groupIdx = Math.floor(idx / 3);
            if (!acc[groupIdx]) {
              acc[groupIdx] = {
                day: `Hari ${Math.floor(idx / 3) * 3 + 1}-${Math.min((Math.floor(idx / 3) + 1) * 3, chartData.length)}`,
                target: 0,
                actual: 0,
              };
            }
            acc[groupIdx].target += item.target;
            acc[groupIdx].actual += item.actual;
            return acc;
          }, [] as any[])
        : chartData;

    return (
      <div key={index} className="bg-gray-900 rounded-xl p-4 h-80">
        <h3 className="text-xl font-semibold text-white mb-2">{name}</h3>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart
            data={processedData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={`colorTarget${index}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient
                id={`colorActual${index}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="day" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "0.5rem",
                color: "#f9fafb",
              }}
              labelStyle={{ color: "#f9fafb" }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="target"
              name="Target PCS"
              stroke="#3b82f6"
              fillOpacity={1}
              fill={`url(#colorTarget${index})`}
            />
            <Area
              type="monotone"
              dataKey="actual"
              name="Actual PCS"
              stroke="#10b981"
              fillOpacity={1}
              fill={`url(#colorActual${index})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Semua Chart Produksi</h1>
        {/* <button
          onClick={() => setCurrentView("dashboard")}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Kembali ke Dashboard
        </button> */}
      </div>

      {savedSchedules.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-8 text-center">
          <p className="text-gray-400">Belum ada jadwal produksi yang dibuat</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {savedSchedules.map((savedSchedule, index) => {
            const chartData = processChartData(savedSchedule.schedule);
            return renderChart(savedSchedule.name, chartData, index);
          })}
        </div>
      )}
    </div>
  );
};

export default AllChartsPage;
