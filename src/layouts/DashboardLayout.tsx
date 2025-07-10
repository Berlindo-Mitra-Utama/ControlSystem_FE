import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { useSchedule } from '../contexts/ScheduleContext';

const DashboardLayout: React.FC = () => {
  const { user, isLoggedIn, handleLogout } = useAuth();
  const { savedSchedules } = useSchedule();

  return (
    <>
      <Navbar
        user={user}
        isLoggedIn={isLoggedIn}
        handleLogout={handleLogout}
        savedSchedulesCount={savedSchedules.length}
      />
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;