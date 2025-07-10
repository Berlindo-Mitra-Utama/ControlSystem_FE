import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ScheduleProvider } from "./contexts/ScheduleContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import HitungCoilLayout from "./layouts/HitungCoilLayout";
import Dashboard from "./pages/Dashboard";
import SchedulerPage from "./pages/SchedulerPage";
import SavedSchedulesPage from "./pages/SavedSchedulesPage";
import AllChartsPage from "./pages/AllChartsPage";
import HitungCoil from "./HitungCoil/pages/hitungcoil";

function App() {
  return (
    <AuthProvider>
      <ScheduleProvider>
        <div className="min-h-screen bg-gray-950">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes with Dashboard Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="scheduler" element={<SchedulerPage />} />
              <Route path="saved" element={<SavedSchedulesPage />} />
              <Route path="allcharts" element={<AllChartsPage />} />
            </Route>

            {/* Protected Route for Hitung Coil with separate layout */}
            <Route
              path="/hitungcoil"
              element={
                <ProtectedRoute>
                  <HitungCoilLayout>
                    <HitungCoil />
                  </HitungCoilLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </ScheduleProvider>
    </AuthProvider>
  );
}

export default App;
