import React from "react";

interface DataCardProps {
  title: string;
  value: string | number;
  unit?: string;
  className?: string;
  icon?: string;
}

const DataCard: React.FC<DataCardProps> = ({ 
  title, 
  value, 
  unit = "", 
  className = "", 
  icon = "" 
}) => (
  <div
    className={`bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 ${className}`}
  >
    <div className="flex items-center gap-2 mb-2">
      <span className="text-lg">{icon}</span>
      <h4 className="text-sm font-medium text-slate-400">{title}</h4>
    </div>
    <div className="text-xl font-bold text-white font-mono">
      {typeof value === "number" ? value.toLocaleString("id-ID") : value}
      {unit && <span className="text-sm text-slate-400 ml-1">{unit}</span>}
    </div>
  </div>
);

export default DataCard;