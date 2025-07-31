import React from "react";
import { useTheme } from "../../../contexts/ThemeContext";

interface StatsCardsProps {
  stats: {
    totalProduction: number;
    totalPlanned: number;
    totalDays: number;
    disruptedItems: number;
  };
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const { uiColors } = useTheme();
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div
        className={`${uiColors.bg.secondary} border ${uiColors.border.primary} rounded-2xl p-6`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${uiColors.text.tertiary}`}>
              Total Production
            </p>
            <p className={`text-2xl font-bold ${uiColors.text.primary}`}>
              {stats.totalProduction.toLocaleString()}
            </p>
            <p className={`text-xs ${uiColors.text.muted}`}>PCS Actual</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
        </div>
      </div>

      <div
        className={`${uiColors.bg.secondary} border ${uiColors.border.primary} rounded-2xl p-6`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${uiColors.text.tertiary}`}>
              Planned Production
            </p>
            <p className={`text-2xl font-bold ${uiColors.text.primary}`}>
              {stats.totalPlanned.toLocaleString()}
            </p>
            <p className={`text-xs ${uiColors.text.muted}`}>PCS Planned</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
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
        </div>
      </div>

      <div
        className={`${uiColors.bg.secondary} border ${uiColors.border.primary} rounded-2xl p-6`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${uiColors.text.tertiary}`}>
              Production Days
            </p>
            <p className={`text-2xl font-bold ${uiColors.text.primary}`}>
              {stats.totalDays}
            </p>
            <p className={`text-xs ${uiColors.text.muted}`}>Days Required</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div
        className={`${uiColors.bg.secondary} border ${uiColors.border.primary} rounded-2xl p-6`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${uiColors.text.tertiary}`}>
              Disruptions
            </p>
            <p className={`text-2xl font-bold ${uiColors.text.primary}`}>
              {stats.disruptedItems}
            </p>
            <p className={`text-xs ${uiColors.text.muted}`}>Items Affected</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
