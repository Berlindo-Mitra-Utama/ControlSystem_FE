import React from "react";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./main_view/contexts/AuthContext";
import { ScheduleProvider } from "./tools_view/planning_system/contexts/ScheduleContext";

// Layouts
import DashboardLayout from "./tools_view/planning_system/layouts/DashboardLayout";
import HitungCoilLayout from "./tools_view/hitung_koil/layouts/HitungCoilLayout";

// Pages
import Dashboard from "./tools_view/planning_system/pages/Dashboard";
import Scheduler from "./tools_view/planning_system/pages/SchedulerPage";
import SavedSchedules from "./tools_view/planning_system/pages/SavedSchedulesPage";
import AllCharts from "./tools_view/planning_system/pages/AllChartsPage";
import HitungCoil from "./tools_view/hitung_koil/pages/hitungcoil";
import LandingPage from "./main_view/pages/LandingPage";
import ToolsDashboard from "./main_view/pages/ToolsDashboard";
import LoginPage from "./main_view/pages/LoginPage";

// Footer import dihapus karena hanya akan digunakan di LandingPage

function App() {
  return (
    <AuthProvider>
      <ScheduleProvider>
        <div className="min-h-screen flex flex-col bg-[#101624]">
          <div className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/tools" element={<ToolsDashboard />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes - Dashboard */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="scheduler" element={<Scheduler />} />
                <Route path="saved" element={<SavedSchedules />} />
                <Route path="allcharts" element={<AllCharts />} />
              </Route>

              {/* Protected Routes - Hitung Coil */}
              <Route path="/hitungcoil" element={<HitungCoilLayout />}>
                <Route index element={<HitungCoil />} />
              </Route>
            </Routes>
          </div>
          {/* Footer dihapus dari sini */}
        </div>
      </ScheduleProvider>
    </AuthProvider>
  );
}

export default App;
