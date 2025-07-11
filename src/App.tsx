import React from "react";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ScheduleProvider } from "./contexts/ScheduleContext";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";
import HitungCoilLayout from "./layouts/HitungCoilLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import Scheduler from "./pages/SchedulerPage";
import SavedSchedules from "./pages/SavedSchedulesPage";
import AllCharts from "./pages/AllChartsPage";
import HitungCoil from "./HitungCoil/pages/hitungcoil";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import ToolsDashboard from "./pages/ToolsDashboard";
import EnhancedLoginPage from "./pages/EnhancedLoginPage";

function App() {
  return (
    <AuthProvider>
      <ScheduleProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/tools" element={<ToolsDashboard />} />
          <Route path="/login" element={<EnhancedLoginPage />} />
          <Route path="/login-old" element={<LoginPage />} />

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
      </ScheduleProvider>
    </AuthProvider>
  );
}

export default App;
