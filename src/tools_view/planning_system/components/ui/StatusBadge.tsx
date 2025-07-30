import React from "react";
import { getStatusColor } from "../../../const/colors";

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = getStatusColor(status);

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className="text-xs">{config.icon}</span>
      {status}
    </span>
  );
};

export default StatusBadge;
