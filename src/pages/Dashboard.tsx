import React from "react";
import StatsCards from "../components/layout/StatsCards";

interface DashboardProps {
  stats: {
    totalProduction: number;
    totalPlanned: number;
    totalDays: number;
    disruptedItems: number;
  };
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>
      <StatsCards stats={stats} />
    </div>
  );
};

export default Dashboard;
