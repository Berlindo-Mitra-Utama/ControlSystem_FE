import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../../../main_view/contexts/AuthContext";
import { useSchedule } from "../contexts/ScheduleContext";
import { useTheme } from "../../contexts/ThemeContext";

const DashboardLayout: React.FC = () => {
  const { user, isLoggedIn, handleLogout } = useAuth();
  const { savedSchedules } = useSchedule();
  const { uiColors } = useTheme();

  return (
    <>
      <Navbar
        user={user}
        isLoggedIn={isLoggedIn}
        handleLogout={handleLogout}
        savedSchedulesCount={savedSchedules.length}
        title="Production Scheduler"
        logo="production"
        showUserInfo={true}
        showLogout={true}
      />
      <div className={`p-6 lg:p-8 ${uiColors.bg.primary}`}>
        <div className="mx-auto max-w-7xl space-y-8">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;
