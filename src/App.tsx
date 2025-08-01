import React from "react";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./main_view/contexts/AuthContext";
import { ScheduleProvider } from "./tools_view/planning_system/contexts/ScheduleContext";
import PlanningSystemLayout from "./tools_view/planning_system/layouts/PlanningSystemLayout";

// Layouts
import DashboardLayout from "./tools_view/planning_system/layouts/DashboardLayout";
import HitungCoilLayout from "./tools_view/hitung_koil/layouts/HitungCoilLayout";
import ElectricityLayout from "./tools_view/electricity_kalkulator/layouts/ElectricityLayout";

// Pages
import Dashboard from "./tools_view/planning_system/pages/Dashboard";
import Scheduler from "./tools_view/planning_system/pages/SchedulerPage";
import SavedSchedules from "./tools_view/planning_system/pages/SavedSchedulesPage";
import AllCharts from "./tools_view/planning_system/pages/AllChartsPage";
import HitungCoil from "./tools_view/hitung_koil/pages/hitungcoil";
import LandingPage from "./main_view/pages/LandingPage";
import ToolsDashboard from "./main_view/pages/ToolsDashboard";
import LoginPage from "./main_view/pages/LoginPage";
import UserManagementPage from "./admin_view/user_management/pages/userManagementPage";
import ProtectedRoute from "./tools_view/planning_system/components/ProtectedRoute";
import ElectricityPage from "./tools_view/electricity_kalkulator/electricity_page";

// Progress Tracker
import DashboardProgres from "./tools_view/progres_tracker/pages/dashboard";
import ManageProgres from "./tools_view/progres_tracker/pages/manage_progres";

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
                <Route path="saved" element={<SavedSchedules />} />
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
                path="/progress/manage"
                element={
                  <ProtectedRoute>
                    <ManageProgres />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progress/manage"
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

              {/* Admin Routes */}
              <Route
                path="/admin/user-management"
                element={
                  <ProtectedRoute>
                    <UserManagementPage />
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
