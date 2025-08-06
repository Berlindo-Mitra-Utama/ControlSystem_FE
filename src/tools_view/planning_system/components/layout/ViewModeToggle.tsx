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
  // Component tidak ditampilkan karena opsi toggle view telah dihilangkan
  // Tampilan akan otomatis menggunakan cards untuk mobile dan table untuk desktop
  // Mengembalikan div kosong untuk menghilangkan opsi tombol Cards dan Table
  return (
    <div className="hidden"></div>
  );
};

export default ViewModeToggle;
