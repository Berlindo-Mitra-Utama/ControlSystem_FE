import React from "react";
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
    <div className="w-full h-96 bg-gray-900 rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">
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
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9ca3af" />
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

export default ProductionChart;
