import React from "react";
import SavedSchedulesView from "../components/layout/SavedSchedulesView";

interface SavedSchedule {
  id: string;
  name: string;
  date: string;
  form: any;
  schedule: any[];
}

interface SavedSchedulesPageProps {
  savedSchedules: SavedSchedule[];
  loadSchedule: (savedSchedule: SavedSchedule) => void;
  deleteSchedule: (id: string) => void;
  setCurrentView: (view: "dashboard" | "scheduler" | "saved") => void;
}

const SavedSchedulesPage: React.FC<SavedSchedulesPageProps> = ({
  savedSchedules,
  loadSchedule,
  deleteSchedule,
  setCurrentView,
}) => {
  return (
    <div className="space-y-6">
      <SavedSchedulesView
        savedSchedules={savedSchedules}
        loadSchedule={loadSchedule}
        deleteSchedule={deleteSchedule}
        setCurrentView={setCurrentView}
      />
    </div>
  );
};

export default SavedSchedulesPage;