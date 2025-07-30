import React from "react";
import { BarChart3, Grid3X3 } from "lucide-react";

interface ViewModeToggleProps {
  currentView: "cards" | "table";
  onViewChange: (view: "cards" | "table") => void;
  className?: string;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  currentView,
  onViewChange,
  className = "",
}) => {
  return (
    <div
      className={`hidden sm:flex bg-slate-800 rounded-lg p-1 border border-slate-600 ${className}`}
    >
      <button
        onClick={() => onViewChange("cards")}
        className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
          currentView === "cards"
            ? "bg-blue-600 text-white shadow-lg"
            : "text-slate-400 hover:text-white hover:bg-slate-700"
        }`}
      >
        <Grid3X3 className="w-4 h-4" />
        Cards
      </button>
      <button
        onClick={() => onViewChange("table")}
        className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
          currentView === "table"
            ? "bg-blue-600 text-white shadow-lg"
            : "text-slate-400 hover:text-white hover:bg-slate-700"
        }`}
      >
        <BarChart3 className="w-4 h-4" />
        Table
      </button>
    </div>
  );
};

export default ViewModeToggle;
