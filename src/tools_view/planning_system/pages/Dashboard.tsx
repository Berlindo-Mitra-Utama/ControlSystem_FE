import React, { useState, useEffect } from "react";
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

// Data part dari mockData di SchedulerPage
const partOptions = ["29N Muffler", "Transmission Case B2", "Brake Disc C3"];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { savedSchedules } = useSchedule();
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    savedSchedules.length > 0
      ? savedSchedules[savedSchedules.length - 1].id
      : null,
  );
  const [selectedPart, setSelectedPart] = useState<string>(
    partOptions.length > 0 ? partOptions[0] : "",
  );

  // Mendapatkan schedule yang dipilih
  const selectedSchedule = React.useMemo(() => {
    if (!selectedScheduleId) return [];
    const found = savedSchedules.find((s) => s.id === selectedScheduleId);
    return found ? found.schedule : [];
  }, [selectedScheduleId, savedSchedules]);

  // Mendapatkan semua schedule untuk part yang dipilih
  const filteredSchedules = React.useMemo(() => {
    return savedSchedules.filter(
      (schedule) => schedule.form && schedule.form.part === selectedPart,
    );
  }, [savedSchedules, selectedPart]);

  // Handler untuk tombol Lihat Semua
  const handleViewAllCharts = () => {
    navigate("/dashboard/allcharts");
  };

  // Handler untuk perubahan part
  const handlePartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPart(e.target.value);
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
    <div className="scheduler-bg w-full min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-blue-400 mb-8">Dashboard</h1>
        <StatsCards stats={stats} />

        {savedSchedules.length > 0 ? (
          <div className="mt-20">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-3xl font-semibold text-blue-400">
                Production Chart
              </h2>
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
            <ProductionChart
              schedules={filteredSchedules}
              onViewAllCharts={handleViewAllCharts}
            />
          </div>
        ) : (
          <div className="mt-8 bg-gray-900 rounded-xl p-8 text-center">
            <p className="text-gray-400">
              Belum ada jadwal produksi yang dibuat
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
