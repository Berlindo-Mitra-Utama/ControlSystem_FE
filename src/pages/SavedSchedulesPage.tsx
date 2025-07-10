import React from "react";
import { useNavigate } from "react-router-dom";
import { useSchedule } from "../contexts/ScheduleContext";
import SavedSchedulesView from "../components/layout/SavedSchedulesView";

const SavedSchedulesPage: React.FC = () => {
  const navigate = useNavigate();
  const { savedSchedules, loadSchedule, deleteSchedule } = useSchedule();

  // Fix: force SchedulerPage to reload schedule by using a callback and a reload flag
  const handleLoadSchedule = (savedSchedule: any) => {
    loadSchedule(savedSchedule);
    navigate("/scheduler");
  };

  return (
    <div className="space-y-6">
      <SavedSchedulesView
        savedSchedules={savedSchedules}
        loadSchedule={handleLoadSchedule}
        deleteSchedule={deleteSchedule}
        setCurrentView={(view: string) => navigate(`/${view}`)}
      />
    </div>
  );
};

export default SavedSchedulesPage;