import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  User,
  Package,
  Layers,
  TrendingUp,
  TrendingDown,
  Trash2,
  Edit,
  AlertTriangle,
} from "lucide-react";
import { memo } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import ChildPart from "./ChildPart";

interface ScheduleItem {
  id: string;
  day: number;
  shift: string;
  pcs: number;
  planningPcs?: number;
  overtimePcs?: number;
  // ...other fields
}

interface ChildPartTableProps {
  partName: string;
  customerName: string;
  initialStock: number | null;
  days: number;
  schedule: ScheduleItem[];
  onDelete?: () => void;
  onEdit?: (data: {
    partName: string;
    customerName: string;
    stock: number | null;
  }) => void;
  onEditSchedule?: () => void;
  onDeleteSchedule?: () => void;
  inMaterial?: (number | null)[][];
  onInMaterialChange?: (val: (number | null)[][]) => void;
  aktualInMaterial?: (number | null)[][];
  onAktualInMaterialChange?: (val: (number | null)[][]) => void;
  renderHeaderAction?: React.ReactNode;
  activeFilter?: string[];
}

// Helper untuk nama hari Indonesia
const DAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

// Komponen input cell memoized
const InputCell = memo(function InputCell({
  value,
  onChange,
  className,
  hasError,
}: {
  value: number | null;
  onChange: (val: number | null) => void;
  className: string;
  hasError?: boolean;
}) {
  return (
    <input
      type="number"
      min={0}
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
      className={`${className} ${hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
    />
  );
});

const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}> = ({ open, onClose, onConfirm, title, message }) => {
  const { uiColors } = useTheme();

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div
        className={`${uiColors.bg.modal} rounded-2xl p-8 ${uiColors.border.primary} max-w-sm w-full`}
      >
        <h2 className={`text-xl font-bold ${uiColors.text.primary} mb-2`}>
          {title}
        </h2>
        <p className={`${uiColors.text.secondary} mb-6`}>{message}</p>
        <div className="flex gap-4 justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded ${uiColors.button.secondary.bg} ${uiColors.button.secondary.hover} ${uiColors.button.secondary.text} ${uiColors.button.secondary.border}`}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded ${uiColors.button.danger.bg} ${uiColors.button.danger.hover} ${uiColors.button.danger.text} ${uiColors.button.danger.border}`}
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

const ChildPartTable: React.FC<ChildPartTableProps> = (props) => {
  const { uiColors } = useTheme();
  // Hapus modal konfirmasi lokal untuk delete part (gunakan modal global dari parent)
  const [showDeleteScheduleModal, setShowDeleteScheduleModal] = useState(false);
  const [showEditPartModal, setShowEditPartModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDisruptionSection, setShowDisruptionSection] = useState(false);

  // In Material per shift per hari: [ [shift1, shift2], ... ]
  const [inMaterialState, setInMaterialState] = useState<(number | null)[][]>(
    props.inMaterial ?? Array.from({ length: props.days }, () => [null, null]),
  );
  // Sinkronisasi jika inMaterialProp berubah (misal, load dari localStorage)
  React.useEffect(() => {
    if (props.inMaterial) setInMaterialState(props.inMaterial);
  }, [props.inMaterial]);

  // Ensure inMaterialState is properly initialized for all days
  const inMaterial = React.useMemo(() => {
    const base = props.inMaterial ?? inMaterialState;
    // Ensure array has correct length and all days are initialized
    const result = Array.from({ length: props.days }, (_, dayIdx) => {
      if (base[dayIdx] && Array.isArray(base[dayIdx])) {
        return [base[dayIdx][0] ?? 0, base[dayIdx][1] ?? 0]; // Ubah null menjadi 0
      }
      return [0, 0]; // Default ke 0
    });
    return result;
  }, [props.inMaterial, inMaterialState, props.days]);

  // State aktualInMaterial benar-benar independen - now using props
  // Ensure aktualInMaterial is properly initialized for all days
  const aktualInMaterial = React.useMemo(() => {
    const base =
      props.aktualInMaterial ??
      Array.from({ length: props.days }, () => [null, null]);
    // Ensure array has correct length and all days are initialized
    const result = Array.from({ length: props.days }, (_, dayIdx) => {
      if (base[dayIdx] && Array.isArray(base[dayIdx])) {
        return [base[dayIdx][0] ?? 0, base[dayIdx][1] ?? 0]; // Ubah null menjadi 0
      }
      return [0, 0]; // Default ke 0
    });
    return result;
  }, [props.aktualInMaterial, props.days]);

  // Gunakan 0 jika initialStock null
  const safeInitialStock = props.initialStock ?? 0;

  // Helper: ambil hasil produksi, planning, overtime dari schedule
  const getScheduleData = (dayIdx: number, shiftIdx: number) => {
    const shiftStr = shiftIdx === 0 ? "1" : "2";
    const item = props.schedule.find(
      (s) => s.day === dayIdx + 1 && s.shift === shiftStr,
    );
    return {
      hasilProduksi: item ? item.pcs : 0,
      planningPcs:
        item && typeof item.planningPcs === "number" ? item.planningPcs : 0,
      overtimePcs:
        item && typeof item.overtimePcs === "number" ? item.overtimePcs : 0,
    };
  };

  // Hitung Teori Stock dan Rencana Stock per shift
  // Flat array: index = day*2 + shift (0=shift1, 1=shift2)
  // This cascades from shift to shift and day to day until the end
  const rencanaStock: number[] = [];

  for (let d = 0; d < props.days; d++) {
    for (let s = 0; s < 2; s++) {
      const idx = d * 2 + s;
      const { hasilProduksi, planningPcs, overtimePcs } = getScheduleData(d, s);

      // Rencana Stock calculation based on formula - cascades through all days/shifts
      if (hasilProduksi === 0) {
        // If Hasil Produksi = 0, use Stock Tersedia + Rencana In Material - (Planning + Overtime)
        if (idx === 0) {
          // First shift of first day: use initial stock
          rencanaStock[idx] =
            safeInitialStock +
            (inMaterial[d][s] ?? 0) -
            (planningPcs + overtimePcs);
        } else {
          // All subsequent shifts/days: use previous stock + current input - (planning + overtime)
          rencanaStock[idx] =
            rencanaStock[idx - 1] +
            (inMaterial[d][s] ?? 0) -
            (planningPcs + overtimePcs);
        }
      } else {
        // If Hasil Produksi != 0, use Previous Stock + Rencana In Material - Hasil Produksi
        if (idx === 0) {
          // First shift of first day: use initial stock
          rencanaStock[idx] =
            safeInitialStock + (inMaterial[d][s] ?? 0) - hasilProduksi;
        } else {
          // All subsequent shifts/days: use previous stock + current input - actual production
          rencanaStock[idx] =
            rencanaStock[idx - 1] + (inMaterial[d][s] ?? 0) - hasilProduksi;
        }
      }
    }
  }

  // Hitung total in material sebulan
  const totalInMaterial = inMaterial.reduce(
    (sum, arr) => sum + (arr[0] ?? 0) + (arr[1] ?? 0),
    0,
  );
  // Hitung total aktual in material sebulan
  const totalAktualInMaterial = aktualInMaterial.reduce(
    (sum, arr) => sum + (arr[0] ?? 0) + (arr[1] ?? 0),
    0,
  );

  // Helper function to check if value has error (negative or less than 0)
  const hasValueError = (value: number | null): boolean => {
    return value !== null && value < 0;
  };

  // Helper function to check if stock value has error
  const hasStockError = (value: number): boolean => {
    return value < 0;
  };

  // Get error count for a specific day
  const getDayErrorCount = (dayIdx: number): number => {
    let errorCount = 0;
    
    // Check inMaterial errors
    if (showRencanaInMaterial) {
      if (hasValueError(inMaterial[dayIdx][0])) errorCount++;
      if (hasValueError(inMaterial[dayIdx][1])) errorCount++;
    }
    
    // Check aktualInMaterial errors
    if (showAktualInMaterial) {
      if (hasValueError(aktualInMaterial[dayIdx][0])) errorCount++;
      if (hasValueError(aktualInMaterial[dayIdx][1])) errorCount++;
    }
    
    // Check stock errors
    if (showRencanaStock) {
      if (hasStockError(rencanaStock[dayIdx * 2])) errorCount++;
      if (hasStockError(rencanaStock[dayIdx * 2 + 1])) errorCount++;
    }
    
    if (showAktualStock) {
      if (hasStockError(aktualStock[dayIdx * 2])) errorCount++;
      if (hasStockError(aktualStock[dayIdx * 2 + 1])) errorCount++;
    }
    
    return errorCount;
  };

  // Handler input granular
  const handleInMaterialChange = useCallback(
    (dayIdx: number, shiftIdx: number, value: number | null) => {
      setInMaterialState((prev) => {
        if (prev[dayIdx][shiftIdx] === value) return prev;
        const next = prev.map((arr, i) => (i === dayIdx ? [...arr] : arr));
        next[dayIdx][shiftIdx] = value;
        if (props.onInMaterialChange) props.onInMaterialChange(next);
        return next;
      });
    },
    [props.onInMaterialChange],
  );
  const handleAktualInMaterialChange = useCallback(
    (dayIdx: number, shiftIdx: number, value: number | null) => {
      if (props.onAktualInMaterialChange) {
        const currentAktualInMaterial =
          props.aktualInMaterial ??
          Array.from({ length: props.days }, () => [null, null]);
        const updated = currentAktualInMaterial.map((arr, i) =>
          i === dayIdx ? [...arr] : arr,
        );
        updated[dayIdx][shiftIdx] = value;
        props.onAktualInMaterialChange(updated);
      }
    },
    [props.onAktualInMaterialChange, props.aktualInMaterial, props.days],
  );

  // Hitung Aktual Stock - cascades from shift to shift and day to day until the end
  const aktualStock: number[] = [];
  for (let d = 0; d < props.days; d++) {
    for (let s = 0; s < 2; s++) {
      const idx = d * 2 + s;
      const { hasilProduksi, planningPcs, overtimePcs } = getScheduleData(d, s);
      const aktualIn = aktualInMaterial[d][s] ?? 0;

      // Aktual Stock calculation based on formula - cascades through all days/shifts
      if (hasilProduksi === 0) {
        // If Hasil Produksi = 0, use Stock Tersedia + Aktual In Material - (Planning + Overtime)
        if (idx === 0) {
          // First shift of first day: use initial stock
          aktualStock[idx] =
            safeInitialStock + aktualIn - (planningPcs + overtimePcs);
        } else {
          // All subsequent shifts/days: use previous stock + current input - (planning + overtime)
          aktualStock[idx] =
            aktualStock[idx - 1] + aktualIn - (planningPcs + overtimePcs);
        }
      } else {
        // If Hasil Produksi != 0, use Previous Stock + Aktual In Material - Hasil Produksi
        if (idx === 0) {
          // First shift of first day: use initial stock
          aktualStock[idx] = safeInitialStock + aktualIn - hasilProduksi;
        } else {
          // All subsequent shifts/days: use previous stock + current input - actual production
          aktualStock[idx] = aktualStock[idx - 1] + aktualIn - hasilProduksi;
        }
      }
    }
  }

  // Determine if we should show each section based on activeFilter
  const showRencanaInMaterial =
    !props.activeFilter ||
    props.activeFilter.length === 0 ||
    props.activeFilter.includes("rencanaInMaterial");
  const showAktualInMaterial =
    !props.activeFilter ||
    props.activeFilter.length === 0 ||
    props.activeFilter.includes("aktualInMaterial");
  const showRencanaStock =
    !props.activeFilter ||
    props.activeFilter.length === 0 ||
    props.activeFilter.includes("rencanaStock");
  const showAktualStock =
    !props.activeFilter ||
    props.activeFilter.length === 0 ||
    props.activeFilter.includes("aktualStock");

  // Helper untuk dapatkan nama hari dari urutan hari ke-d (mulai Senin)
  const getDayName = (day: number) => {
    // Misal hari ke-1 = Senin, dst. (bisa diubah sesuai kebutuhan)
    // Di gambar, hari ke-1 = Selasa, jadi offset = 2
    const offset = 2; // 0=Minggu, 1=Senin, 2=Selasa, dst
    return DAY_NAMES[(offset + day) % 7];
  };

  // Wrap delete
  const handleDeleteClick = () => {
    // Delegasikan konfirmasi ke parent (modal global)
    if (props.onDelete) props.onDelete();
  };

  const handleEditSchedule = () => {
    if (props.onEditSchedule) {
      props.onEditSchedule();
    }
  };

  const handleDeleteSchedule = () => {
    setShowDeleteScheduleModal(true);
  };

  const handleEditPart = () => {
    setShowEditPartModal(true);
  };

  const handleEditPartSubmit = (data: {
    partName: string;
    customerName: string;
    stock: number | null;
  }) => {
    if (props.onEdit) props.onEdit(data);
    setShowEditPartModal(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // This useEffect is no longer needed as the dropdown is removed
      // if (showScheduleActions) {
      //   const target = event.target as Element;
      //   if (!target.closest(".schedule-actions-dropdown")) {
      //     setShowScheduleActions(false);
      //   }
      // }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); // Removed showScheduleActions from dependency array

  // Loading logic for navigation/filter
  // If you have navigation/filter change, wrap setState with:
  // setLoading(true); setTimeout(() => { ...setState...; setLoading(false); }, 500);

  // Input reset effect - ensure all days are properly initialized
  useEffect(() => {
    // Ensure inMaterialState is properly initialized for all days
    setInMaterialState((prev) => {
      const next = [...prev];
      // Initialize any missing days with [0, 0]
      for (let i = 0; i < props.days; i++) {
        if (!next[i]) {
          next[i] = [0, 0];
        }
      }
      return next;
    });

    // Note: aktualInMaterial is now managed by props, so no local state reset needed
  }, [props.days]); // Run when days prop changes

  return (
    <div className="space-y-6">
      {/* Info Part dan Customer */}
      <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <div className="flex items-center gap-4">
            {/* Part Info */}
            {props.partName && (
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    Part:
                  </span>{" "}
                  {props.partName}
                </span>
              </div>
            )}
            {/* Customer Info */}
            {props.customerName && (
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    Customer:
                  </span>{" "}
                  {props.customerName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card Stock Info dengan Action Buttons */}
        <div className="flex flex-wrap gap-4 items-center mb-6 justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Stock Info */}
            <div className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-4 py-2 font-semibold text-base flex items-center gap-2 shadow border border-gray-300 dark:border-gray-600">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Stock Awal:{" "}
              <span className="ml-1 text-blue-700 dark:text-blue-300">
                {props.initialStock === null
                  ? "0"
                  : props.initialStock.toLocaleString()}
              </span>
            </div>
            {/* Total Rencana Info */}
            <div className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-4 py-2 font-semibold text-base flex items-center gap-2 shadow border border-gray-300 dark:border-gray-600">
              <Layers className="w-5 h-5 text-green-600 dark:text-green-400" />
              Total Rencana:{" "}
              <span className="ml-1 text-green-700 dark:text-green-400">
                {totalInMaterial.toLocaleString()}
              </span>
            </div>
            {/* Total Aktual Info */}
            <div className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-4 py-2 font-semibold text-base flex items-center gap-2 shadow border border-gray-300 dark:border-gray-600">
              <Layers className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              Total Aktual:{" "}
              <span className="ml-1 text-yellow-700 dark:text-yellow-400">
                {totalAktualInMaterial.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 items-center">
            {/* Disruption Button */}
            <button
              onClick={() => setShowDisruptionSection(!showDisruptionSection)}
              className={`p-2 rounded-lg transition-all duration-200 flex items-center gap-2 relative ${
                showDisruptionSection 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
              title="Toggle Disruption Section"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Disruption</span>
              {/* Error Badge */}
              {Array.from({ length: props.days }, (_, dayIdx) => getDayErrorCount(dayIdx)).some(count => count > 0) && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  !
                </span>
              )}
            </button>

            {/* Edit Part Button */}
            <button
              onClick={handleEditPart}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
              title="Edit Part"
            >
              <Edit className="w-4 h-4" />
              <span className="text-sm font-medium">Edit Part</span>
            </button>

            {/* Edit Schedule Button */}
            {props.onEditSchedule && (
              <button
                onClick={handleEditSchedule}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                title="Edit Jadwal"
              >
                <Edit className="w-4 h-4" />
                <span className="text-sm font-medium">Edit Jadwal</span>
              </button>
            )}

            {/* Delete Schedule Button */}
            {props.onDeleteSchedule && (
              <button
                onClick={handleDeleteSchedule}
                className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                title="Hapus Jadwal"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">Hapus Jadwal</span>
              </button>
            )}

            {/* Delete Button */}
            {props.renderHeaderAction && (
              <button
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                onClick={handleDeleteClick}
                type="button"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">Hapus Part</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="relative bg-gray-100 dark:bg-gray-800/50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Container with horizontal scroll */}
        <div className="flex">
          {/* Frozen Left Column - DESCRIPTION */}
          <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 border-r border-gray-300 dark:border-gray-600 w-48">
            {/* Header */}
            <div className="h-24 flex items-center justify-center bg-gray-300 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
              <div className="text-gray-900 dark:text-white font-bold text-lg text-center px-4">
                DESCRIPTION
              </div>
            </div>

            {/* Rows */}
            <div className="space-y-0">
              {/* In Material */}
              {showRencanaInMaterial && (
                <div className="h-16 flex items-center justify-center px-4 bg-gray-200 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold text-sm text-center leading-tight">
                  <div className="whitespace-pre-line">RENCANA IN MATERIAL</div>
                </div>
              )}
              {/* Aktual In Material */}
              {showAktualInMaterial && (
                <div className="h-16 flex items-center justify-center px-4 bg-gray-200 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold text-sm text-center leading-tight">
                  <div className="whitespace-pre-line">AKTUAL IN MATERIAL</div>
                </div>
              )}
              {/* Rencana Stock */}
              {showRencanaStock && (
                <div className="h-16 flex items-center justify-center px-4 bg-gray-200 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold text-sm text-center leading-tight">
                  <div className="whitespace-pre-line">RENCANA STOCK (PCS)</div>
                </div>
              )}
              {/* Aktual Stock */}
              {showAktualStock && (
                <div className="h-16 flex items-center justify-center px-4 bg-gray-200 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold text-sm text-center leading-tight">
                  <div className="whitespace-pre-line">AKTUAL STOCK (PCS)</div>
                </div>
              )}
            </div>
          </div>

          {/* TOTAL Column */}
          <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 border-r border-gray-300 dark:border-gray-600 w-40">
            {/* Header */}
            <div className="h-24 flex items-center justify-center bg-gray-300 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
              <div className="text-gray-900 dark:text-white font-bold text-lg text-center px-4">
                TOTAL
              </div>
            </div>

            {/* Total Rows */}
            <div className="space-y-0">
              {showRencanaInMaterial && (
                <div className="h-16 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 border-b border-gray-300 dark:border-gray-600 text-blue-700 dark:text-blue-200 font-mono text-sm font-bold">
                  {totalInMaterial.toLocaleString()}
                </div>
              )}
              {showAktualInMaterial && (
                <div className="h-16 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 border-b border-gray-300 dark:border-gray-600 text-blue-700 dark:text-blue-200 font-mono text-sm font-bold">
                  {totalAktualInMaterial.toLocaleString()}
                </div>
              )}
              {showRencanaStock && (
                <div className="h-16 flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30 border-b border-gray-300 dark:border-gray-600 text-yellow-700 dark:text-yellow-200 font-mono text-sm font-bold">
                  -
                </div>
              )}
              {showAktualStock && (
                <div className="h-16 flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30 border-b border-gray-300 dark:border-gray-600 text-yellow-700 dark:text-yellow-200 font-mono text-sm font-bold">
                  -
                </div>
              )}
            </div>
          </div>

          {/* Scrollable Right Section - Date Columns */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex min-w-max">
              {Array.from({ length: props.days }, (_, dayIdx) => (
                <div
                  key={dayIdx}
                  className="flex-shrink-0 w-40 border-r border-gray-300 dark:border-gray-600"
                >
                  {/* Date Header */}
                  <div className="h-24 bg-gray-300 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
                    <div className="text-center p-3">
                      <div className="text-gray-900 dark:text-white font-bold">
                        <div>
                          <div className="text-sm">{getDayName(dayIdx)}</div>
                          <div className="text-xl font-bold">{dayIdx + 1}</div>
                        </div>
                      </div>
                      {/* Shift Headers */}
                      <div className="grid grid-cols-2 gap-1 mt-2">
                        <div className="bg-blue-600 text-white text-sm py-1 rounded font-semibold">
                          SHIFT 1
                        </div>
                        <div className="bg-purple-600 text-white text-sm py-1 rounded font-semibold">
                          SHIFT 2
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Rows */}
                  <div className="space-y-0">
                    {/* Rencana In Material - Baris 1 */}
                    {showRencanaInMaterial && (
                      <div className="h-16 grid grid-cols-2 gap-1 border-b border-gray-300 dark:border-gray-600 bg-blue-100 dark:bg-blue-900/30">
                        <div className="text-center flex items-center justify-center text-blue-700 dark:text-blue-200 font-mono text-sm font-semibold">
                          <InputCell
                            value={inMaterial[dayIdx][0]}
                            onChange={(v) =>
                              handleInMaterialChange(dayIdx, 0, v)
                            }
                            className="w-16 px-2 py-1 rounded bg-blue-200 dark:bg-blue-800/50 border border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            hasError={hasValueError(inMaterial[dayIdx][0])}
                          />
                        </div>
                        <div className="text-center flex items-center justify-center text-blue-700 dark:text-blue-200 font-mono text-sm font-semibold">
                          <InputCell
                            value={inMaterial[dayIdx][1]}
                            onChange={(v) =>
                              handleInMaterialChange(dayIdx, 1, v)
                            }
                            className="w-16 px-2 py-1 rounded bg-blue-200 dark:bg-blue-800/50 border border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            hasError={hasValueError(inMaterial[dayIdx][1])}
                          />
                        </div>
                      </div>
                    )}
                    {/* Aktual In Material - Baris 2 */}
                    {showAktualInMaterial && (
                      <div className="h-16 grid grid-cols-2 gap-1 border-b border-gray-300 dark:border-gray-600 bg-blue-100 dark:bg-blue-900/30">
                        <div className="text-center flex items-center justify-center text-blue-700 dark:text-blue-200 font-mono text-sm font-semibold">
                          <InputCell
                            value={aktualInMaterial[dayIdx][0]}
                            onChange={(v) =>
                              handleAktualInMaterialChange(dayIdx, 0, v)
                            }
                            className="w-16 px-2 py-1 rounded bg-blue-200 dark:bg-blue-800/50 border border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200 text-center focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            hasError={hasValueError(aktualInMaterial[dayIdx][0])}
                          />
                        </div>
                        <div className="text-center flex items-center justify-center text-blue-700 dark:text-blue-200 font-mono text-sm font-semibold">
                          <InputCell
                            value={aktualInMaterial[dayIdx][1]}
                            onChange={(v) =>
                              handleAktualInMaterialChange(dayIdx, 1, v)
                            }
                            className="w-16 px-2 py-1 rounded bg-blue-200 dark:bg-blue-800/50 border border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200 text-center focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            hasError={hasValueError(aktualInMaterial[dayIdx][1])}
                          />
                        </div>
                      </div>
                    )}
                    {/* Rencana Stock - Baris 3 */}
                    {showRencanaStock && (
                      <div className="h-16 grid grid-cols-2 gap-1 border-b border-gray-300 dark:border-gray-600 bg-yellow-100 dark:bg-yellow-900/30">
                        <div className={`text-center flex items-center justify-center font-mono text-sm font-semibold ${
                          hasStockError(rencanaStock[dayIdx * 2]) 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {rencanaStock[dayIdx * 2]?.toFixed(0) || "0"}
                        </div>
                        <div className={`text-center flex items-center justify-center font-mono text-sm font-semibold ${
                          hasStockError(rencanaStock[dayIdx * 2 + 1]) 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {rencanaStock[dayIdx * 2 + 1]?.toFixed(0) || "0"}
                        </div>
                      </div>
                    )}
                    {/* Aktual Stock - Baris 4 */}
                    {showAktualStock && (
                      <div className="h-16 grid grid-cols-2 gap-1 border-b border-gray-300 dark:border-gray-600 bg-yellow-100 dark:bg-yellow-900/30">
                        <div className={`text-center flex items-center justify-center font-mono text-sm font-semibold ${
                          hasStockError(aktualStock[dayIdx * 2]) 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {aktualStock[dayIdx * 2]?.toFixed(0) || "0"}
                        </div>
                        <div className={`text-center flex items-center justify-center font-mono text-sm font-semibold ${
                          hasStockError(aktualStock[dayIdx * 2 + 1]) 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {aktualStock[dayIdx * 2 + 1]?.toFixed(0) || "0"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Disruption Section - Show below table when disruption button is clicked */}
        {showDisruptionSection && (
          <div className="bg-gray-50 dark:bg-gray-900/20 border-t border-gray-200 dark:border-gray-800 p-4">
            {Array.from({ length: props.days }, (_, dayIdx) => getDayErrorCount(dayIdx)).some(count => count > 0) ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-red-800 dark:text-red-200 font-semibold">Peringatan: Nilai Negatif Ditemukan</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: props.days }, (_, dayIdx) => {
                    const errorCount = getDayErrorCount(dayIdx);
                    if (errorCount === 0) return null;
                    
                    return (
                      <div key={dayIdx} className="bg-red-100 dark:bg-red-800/30 rounded-lg p-3 border border-red-200 dark:border-red-700">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-red-700 dark:text-red-300 font-semibold">
                            {getDayName(dayIdx)} {dayIdx + 1}
                          </span>
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {errorCount} error
                          </span>
                        </div>
                        <div className="text-sm text-red-600 dark:text-red-400 space-y-1">
                          {showRencanaInMaterial && (
                            <>
                              {hasValueError(inMaterial[dayIdx][0]) && (
                                <div>• Shift 1 Rencana: {inMaterial[dayIdx][0]} (negatif)</div>
                              )}
                              {hasValueError(inMaterial[dayIdx][1]) && (
                                <div>• Shift 2 Rencana: {inMaterial[dayIdx][1]} (negatif)</div>
                              )}
                            </>
                          )}
                          {showAktualInMaterial && (
                            <>
                              {hasValueError(aktualInMaterial[dayIdx][0]) && (
                                <div>• Shift 1 Aktual: {aktualInMaterial[dayIdx][0]} (negatif)</div>
                              )}
                              {hasValueError(aktualInMaterial[dayIdx][1]) && (
                                <div>• Shift 2 Aktual: {aktualInMaterial[dayIdx][1]} (negatif)</div>
                              )}
                            </>
                          )}
                          {showRencanaStock && (
                            <>
                              {hasStockError(rencanaStock[dayIdx * 2]) && (
                                <div>• Shift 1 Rencana Stock: {rencanaStock[dayIdx * 2]?.toFixed(0)} (negatif)</div>
                              )}
                              {hasStockError(rencanaStock[dayIdx * 2 + 1]) && (
                                <div>• Shift 2 Rencana Stock: {rencanaStock[dayIdx * 2 + 1]?.toFixed(0)} (negatif)</div>
                              )}
                            </>
                          )}
                          {showAktualStock && (
                            <>
                              {hasStockError(aktualStock[dayIdx * 2]) && (
                                <div>• Shift 1 Aktual Stock: {aktualStock[dayIdx * 2]?.toFixed(0)} (negatif)</div>
                              )}
                              {hasStockError(aktualStock[dayIdx * 2 + 1]) && (
                                <div>• Shift 2 Aktual Stock: {aktualStock[dayIdx * 2 + 1]?.toFixed(0)} (negatif)</div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold">Tidak ada nilai negatif ditemukan. Semua data valid.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal konfirmasi hapus part dihapus, gunakan modal global dari parent */}

      {/* Delete Schedule Confirmation Modal */}
      <Modal
        open={showDeleteScheduleModal}
        onClose={() => setShowDeleteScheduleModal(false)}
        onConfirm={() => {
          setShowDeleteScheduleModal(false);
          if (props.onDeleteSchedule) {
            props.onDeleteSchedule();
          }
        }}
        title="Konfirmasi Hapus Jadwal"
        message="Apakah Anda yakin ingin menghapus jadwal ini?"
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Edit Part Modal */}
      <ChildPart
        isOpen={showEditPartModal}
        onClose={() => setShowEditPartModal(false)}
        onGenerate={() => {}}
        onEdit={handleEditPartSubmit}
        onDelete={props.onDelete}
        initialData={{
          partName: props.partName,
          customerName: props.customerName,
          stock: props.initialStock,
        }}
        isEditMode={true}
      />
    </div>
  );
};

export default memo(ChildPartTable);
