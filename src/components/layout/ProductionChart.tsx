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

interface ProductionChartProps {
  schedule: ScheduleItem[];
}

const ProductionChart: React.FC<ProductionChartProps> = ({ schedule }) => {
  // Mengolah data untuk chart
  const chartData = React.useMemo(() => {
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
  }, [schedule]);

  return (
    <div className="w-full h-96 bg-gray-900 rounded-xl p-4">
      <h3 className="text-xl font-semibold text-white mb-4">
        Target vs Actual Production
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
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
            fill="url(#colorTarget)"
          />
          <Area
            type="monotone"
            dataKey="actual"
            name="Actual PCS"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorActual)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProductionChart;
