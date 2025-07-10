import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSchedule } from "../contexts/ScheduleContext";
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { savedSchedules } = useSchedule();
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    savedSchedules.length > 0
      ? savedSchedules[savedSchedules.length - 1].id
      : null,
  );

  // Mendapatkan schedule yang dipilih
  const selectedSchedule = React.useMemo(() => {
    if (!selectedScheduleId) return [];
    const found = savedSchedules.find((s) => s.id === selectedScheduleId);
    return found ? found.schedule : [];
  }, [selectedScheduleId, savedSchedules]);

  // Handler untuk tombol Lihat Semua
  const handleViewAllCharts = () => {
    navigate("/allcharts");
  };

  // Calculate stats
  const stats = {
    totalProduction: savedSchedules.reduce((total, schedule) => {
      return (
        total +
        schedule.schedule.reduce((sum, item) => sum + (item.actualPcs || 0), 0)
      );
    }, 0),
    totalPlanned: savedSchedules.reduce((total, schedule) => {
      return total + schedule.schedule.reduce((sum, item) => sum + item.pcs, 0);
    }, 0),
    totalDays: savedSchedules.reduce((total, schedule) => {
      const maxDay = Math.max(...schedule.schedule.map((item) => item.day));
      return total + maxDay;
    }, 0),
    disruptedItems: savedSchedules.reduce((total, schedule) => {
      return (
        total +
        schedule.schedule.filter((item) => item.status === "Gangguan").length
      );
    }, 0),
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>
      <StatsCards stats={stats} />

      {savedSchedules.length > 0 ? (
        <div className="mt-20">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-3xl font-semibold text-white">
              Production Chart
            </h2>
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
