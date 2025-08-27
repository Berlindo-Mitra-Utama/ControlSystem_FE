import React from "react";
import { useTheme } from "../../../contexts/ThemeContext";
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

interface ScheduleItem {
  id: string;
  day: number;
  shift: string;
  type: string;
  pcs: number;
  time: string;
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

interface ProductionChartProps {
  schedules: SavedSchedule[];
  onViewAllCharts?: () => void;
}

const ProductionChart: React.FC<ProductionChartProps> = ({
  schedules,
  onViewAllCharts,
}) => {
  const { uiColors } = useTheme();
  // Mengolah data untuk chart
  const chartData = React.useMemo(() => {
    // Buat template data untuk semua bulan
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
    const initialMonthlyData: Record<string, { akumulasiDelivery: number }> =
      {};
    months.forEach((month) => {
      initialMonthlyData[month] = { akumulasiDelivery: 0 };
    });

    if (!schedules || schedules.length === 0) {
      // Jika tidak ada data, kembalikan template kosong
      return months.map((month) => ({
        month,
        akumulasiDelivery: 0,
      }));
    }

    // Mengelompokkan data berdasarkan bulan
    const monthlyData = schedules.reduce<
      Record<string, { akumulasiDelivery: number }>
    >(
      (acc, savedSchedule) => {
        // Ekstrak bulan dari nama jadwal (format: "Bulan Tahun")
        const scheduleName = savedSchedule.name;
        const monthName = scheduleName.split(" ")[0]; // Ambil nama bulan saja

        if (!acc[monthName]) {
          // Jika bulan tidak ada di accumulator (seharusnya tidak terjadi karena sudah diinisialisasi)
          acc[monthName] = { akumulasiDelivery: 0 };
        }

        // Hitung total pengiriman untuk jadwal ini
        let totalDelivery = 0;

        savedSchedule.schedule.forEach((item) => {
          totalDelivery += item.delivery || 0;
        });

        // Tambahkan ke akumulator
        acc[monthName].akumulasiDelivery += totalDelivery;

        return acc;
      },
      initialMonthlyData, // Gunakan template yang sudah diinisialisasi
    );

    // Ubah ke format array untuk recharts
    return months.map((month) => ({
      month,
      akumulasiDelivery: monthlyData[month].akumulasiDelivery,
    }));
  }, [schedules]);

  return (
    <div className={`w-full ${uiColors.bg.secondary} rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-xl font-semibold ${uiColors.text.primary}`}>
          Akumulasi Delivery per Bulan
        </h3>
        {onViewAllCharts && (
          <button
            onClick={onViewAllCharts}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
          >
            Lihat Semua
          </button>
        )}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={uiColors.bg.primary === "bg-gray-50" ? "#e5e7eb" : "#374151"}
              />
              <XAxis
                dataKey="month"
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
              <Bar
                dataKey="akumulasiDelivery"
                name="Akumulasi Delivery"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProductionChart;
