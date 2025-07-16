import React from "react";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./main/contexts/AuthContext";
import { ScheduleProvider } from "./tools/planning_system/contexts/ScheduleContext";

// Layouts
import DashboardLayout from "./tools/planning_system/layouts/DashboardLayout";
import HitungCoilLayout from "./tools/hitung_koil/layouts/HitungCoilLayout";

// Pages
import Dashboard from "./tools/planning_system/pages/Dashboard";
import Scheduler from "./tools/planning_system/pages/SchedulerPage";
import SavedSchedules from "./tools/planning_system/pages/SavedSchedulesPage";
import AllCharts from "./tools/planning_system/pages/AllChartsPage";
import HitungCoil from "./tools/hitung_koil/pages/hitungcoil";
import LandingPage from "./main/pages/LandingPage";
import ToolsDashboard from "./main/pages/ToolsDashboard";
import EnhancedLoginPage from "./main/pages/EnhancedLoginPage";

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
              <Route path="/login" element={<EnhancedLoginPage />} />

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
