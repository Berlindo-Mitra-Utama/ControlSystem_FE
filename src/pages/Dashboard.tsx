import React, { useState } from "react";
import StatsCards from "../components/layout/StatsCards";
import ProductionChart from "../components/layout/ProductionChart";

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

interface DashboardProps {
  stats: {
    totalProduction: number;
    totalPlanned: number;
    totalDays: number;
    disruptedItems: number;
  };
  schedule?: ScheduleItem[];
  savedSchedules?: SavedSchedule[];
  setCurrentView: (view: "dashboard" | "scheduler" | "saved" | "allcharts") => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  stats,
  schedule = [],
  savedSchedules = [],
  setCurrentView,
}) => {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    savedSchedules.length > 0
      ? savedSchedules[savedSchedules.length - 1].id
      : null,
  );

  // Mendapatkan schedule yang dipilih
  const selectedSchedule = React.useMemo(() => {
    if (!selectedScheduleId) return schedule;
    const found = savedSchedules.find((s) => s.id === selectedScheduleId);
    return found ? found.schedule : schedule;
  }, [selectedScheduleId, savedSchedules, schedule]);

  // Handler untuk tombol Lihat Semua
  const handleViewAllCharts = () => {
    setCurrentView("allcharts");
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>
      <StatsCards stats={stats} />

      {savedSchedules.length > 0 ? (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Production Chart
            </h2>
            <select
              value={selectedScheduleId || ""}
              onChange={(e) => setSelectedScheduleId(e.target.value || null)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {savedSchedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <ProductionChart 
            schedule={selectedSchedule} 
            onViewAllCharts={handleViewAllCharts} 
          />
        </div>
      ) : (
        <div className="mt-8 bg-gray-900 rounded-xl p-8 text-center">
          <p className="text-gray-400">Belum ada jadwal produksi yang dibuat</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
