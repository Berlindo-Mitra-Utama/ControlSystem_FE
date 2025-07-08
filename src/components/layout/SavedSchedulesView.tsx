import React from "react";

interface ScheduleItem {
  id: string;
  name: string;
  date: string;
  form: any;
  schedule: any[];
}

interface SavedSchedulesViewProps {
  savedSchedules: ScheduleItem[];
  loadSchedule: (savedSchedule: ScheduleItem) => void;
  deleteSchedule: (id: string) => void;
  setCurrentView: (view: "scheduler" | "saved") => void;
}

const SavedSchedulesView: React.FC<SavedSchedulesViewProps> = ({
  savedSchedules,
  loadSchedule,
  deleteSchedule,
  setCurrentView,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Saved Schedules</h2>
      {savedSchedules.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No Saved Schedules
          </h3>
          <p className="text-gray-400 mb-6">
            Create and save your first production schedule to see it here.
          </p>
          <button
            onClick={() => setCurrentView("scheduler")}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
          >
            Create Schedule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedSchedules.map((savedSchedule) => (
            <div
              key={savedSchedule.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {savedSchedule.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Created: {savedSchedule.date}
                  </p>
                </div>
                <button
                  onClick={() => deleteSchedule(savedSchedule.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors duration-200"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Part:</span>
                  <span className="text-white">
                    {savedSchedule.form.part || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Customer:</span>
                  <span className="text-white">
                    {savedSchedule.form.customer || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Items:</span>
                  <span className="text-white">
                    {savedSchedule.schedule.length} schedule items
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  loadSchedule(savedSchedule);
                  setCurrentView && setCurrentView("scheduler");
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
              >
                Load Schedule
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedSchedulesView;
