import React from "react";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./main_view/contexts/AuthContext";
import { ScheduleProvider } from "./tools_view/planning_system/contexts/ScheduleContext";
import PlanningSystemLayout from "./tools_view/planning_system/layouts/PlanningSystemLayout";

// Layouts
import DashboardLayout from "./tools_view/planning_system/layouts/DashboardLayout";
import HitungCoilLayout from "./tools_view/hitung_koil/layouts/HitungCoilLayout";
import ElectricityLayout from "./tools_view/electricity_kalkulator/layouts/ElectricityLayout";
import WeldingLayout from "./tools_view/welding_kalkulator/layouts/WeldingLayout";

// Pages
import Dashboard from "./tools_view/planning_system/pages/Dashboard";
import Scheduler from "./tools_view/planning_system/pages/SchedulerPage";
import AllCharts from "./tools_view/planning_system/pages/AllChartsPage";
import HitungCoil from "./tools_view/hitung_koil/pages/hitungcoil";
import LandingPage from "./main_view/pages/LandingPage";
import ToolsDashboard from "./main_view/pages/ToolsDashboard";
import LoginPage from "./main_view/pages/LoginPage";
import UserManagementPage from "./admin_view/user_management/pages/userManagementPage";
import ProtectedRoute from "./tools_view/planning_system/components/ProtectedRoute";
import ElectricityPage from "./tools_view/electricity_kalkulator/electricity_page";
import WeldingCalculator from "./tools_view/welding_kalkulator/welding_calculator";

// Progress Tracker
import DashboardProgres from "./tools_view/progres_tracker/pages/dashboard";
import ManageProgres from "./tools_view/progres_tracker/pages/manage_progres";

// Work Standard
import Component from "./tools_view/standart_kerja/work-standard";

function App() {
  return (
    <AuthProvider>
      <ScheduleProvider>
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
          <div className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/tools" element={<ToolsDashboard />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes - Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <PlanningSystemLayout>
                      <DashboardLayout />
                    </PlanningSystemLayout>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="scheduler" element={<Scheduler />} />
                {/* Removed SavedSchedules route (not used) */}
                <Route path="allcharts" element={<AllCharts />} />
              </Route>

              {/* Protected Routes - Progress Tracker */}
              <Route
                path="/progress"
                element={
                  <ProtectedRoute>
                    <DashboardProgres />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progress/manage_progres/:partId"
                element={
                  <ProtectedRoute>
                    <ManageProgres />
                  </ProtectedRoute>
                }
              />

              {/* Public Tools - Hitung Coil */}
              <Route path="/hitungcoil" element={<HitungCoilLayout />}>
                <Route index element={<HitungCoil />} />
              </Route>

              {/* Public Tools - Electricity Calculator */}
              <Route path="/electricity" element={<ElectricityLayout />}>
                <Route index element={<ElectricityPage />} />
              </Route>

              {/* Public Tools - Welding Calculator */}
              <Route path="/welding" element={<WeldingLayout />}>
                <Route index element={<WeldingCalculator />} />
              </Route>

              {/* Admin Routes */}
              <Route
                path="/admin/user-management"
                element={
                  <ProtectedRoute>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* Work Standard */}
              <Route
                path="/work-standard"
                element={
                  <ProtectedRoute>
                    <Component />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </ScheduleProvider>
    </AuthProvider>
  );
}

export default App;
