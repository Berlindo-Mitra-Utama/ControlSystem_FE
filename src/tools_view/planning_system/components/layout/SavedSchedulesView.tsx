import React from "react";
import { useTheme } from "../../../contexts/ThemeContext";

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
  const { theme } = useTheme();

  // Fungsi untuk mendapatkan warna berdasarkan theme
  const getThemeColors = () => {
    const isDark = theme === "dark";
    return {
      // Background colors
      pageBg: isDark ? "bg-gray-900" : "bg-gray-50",
      cardBg: isDark ? "bg-gray-900" : "bg-white",
      emptyStateBg: isDark ? "bg-gray-900" : "bg-white",

      // Text colors
      titleText: isDark ? "text-white" : "text-gray-900",
      bodyText: isDark ? "text-gray-400" : "text-gray-700",
      subtitleText: isDark ? "text-gray-400" : "text-gray-600",

      // Border colors
      borderColor: isDark ? "border-gray-800" : "border-gray-200",
      cardBorder: isDark ? "border-gray-800" : "border-gray-200",

      // Button colors
      buttonBg: isDark
        ? "from-blue-600 to-indigo-600"
        : "from-blue-600 to-indigo-600",
      buttonHover: isDark
        ? "hover:from-blue-700 hover:to-indigo-700"
        : "hover:from-blue-700 hover:to-indigo-700",

      // Icon colors
      iconBg: isDark ? "bg-gray-800" : "bg-gray-100",
      iconColor: isDark ? "text-gray-600" : "text-gray-500",
      deleteIconColor: isDark ? "text-gray-500" : "text-gray-400",
      deleteIconHover: isDark ? "hover:text-red-400" : "hover:text-red-500",
    };
  };
  const colors = getThemeColors();

  return (
    <div
      className={`${colors.pageBg} border ${colors.borderColor} rounded-3xl p-8 shadow-lg`}
    >
      <h2 className={`text-3xl font-bold ${colors.titleText} mb-6`}>
        Saved Schedules
      </h2>
      {savedSchedules.length === 0 ? (
        <div
          className={`${colors.emptyStateBg} border ${colors.cardBorder} rounded-2xl p-12 text-center shadow-lg`}
        >
          <div
            className={`w-16 h-16 ${colors.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}
          >
            <svg
              className={`w-8 h-8 ${colors.iconColor}`}
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
          <h3 className={`text-xl font-semibold ${colors.titleText} mb-2`}>
            No Saved Schedules
          </h3>
          <p className={`${colors.bodyText} mb-6`}>
            Create and save your first production schedule to see it here.
          </p>
          <button
            onClick={() => setCurrentView("scheduler")}
            className={`px-6 py-3 bg-gradient-to-r ${colors.buttonBg} text-white font-semibold rounded-xl ${colors.buttonHover} transition-all duration-300`}
          >
            Create Schedule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedSchedules.map((savedSchedule) => (
            <div
              key={savedSchedule.id}
              className={`${colors.cardBg} border ${colors.cardBorder} rounded-2xl p-6 shadow-lg`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3
                    className={`text-lg font-semibold ${colors.titleText} mb-1`}
                  >
                    {savedSchedule.name}
                  </h3>
                  <p className={`text-sm ${colors.bodyText}`}>
                    Created: {savedSchedule.date}
                  </p>
                </div>
                <button
                  onClick={() => deleteSchedule(savedSchedule.id)}
                  className={`${colors.deleteIconColor} ${colors.deleteIconHover} transition-colors duration-200`}
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
                  <span className={colors.bodyText}>Part:</span>
                  <span className={colors.titleText}>
                    {savedSchedule.form.part || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={colors.bodyText}>Customer:</span>
                  <span className={colors.titleText}>
                    {savedSchedule.form.customer || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={colors.bodyText}>Items:</span>
                  <span className={colors.titleText}>
                    {savedSchedule.schedule.length} schedule items
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  loadSchedule(savedSchedule);
                  setCurrentView && setCurrentView("scheduler");
                }}
                className={`w-full px-4 py-2 bg-gradient-to-r ${colors.buttonBg} text-white font-medium rounded-lg ${colors.buttonHover} transition-all duration-300`}
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
