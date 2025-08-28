import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  User,
  Package,
  Layers,
  TrendingUp,
  TrendingDown,
  Trash2,
  Edit,
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

interface ChildPartCardViewProps {
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
}: {
  value: number | null;
  onChange: (val: number | null) => void;
  className: string;
}) {
  return (
    <input
      type="number"
      min={0}
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
      className={className}
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

const ChildPartCardView: React.FC<ChildPartCardViewProps> = (props) => {
  const { uiColors } = useTheme();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteScheduleModal, setShowDeleteScheduleModal] = useState(false);
  const [showEditPartModal, setShowEditPartModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteTargetIndex, setDeleteTargetIndex] = useState<number | null>(
    null,
  );

  // Track days that have user input to prevent resetting
  const [daysWithUserInput, setDaysWithUserInput] = useState<Set<number>>(
    new Set(),
  );

  // In Material per shift per hari: [ [shift1, shift2], ... ]
  const [inMaterialState, setInMaterialState] = useState<(number | null)[][]>(
    props.inMaterial ?? Array.from({ length: props.days }, () => [null, null]),
  );

  // Sinkronisasi jika inMaterialProp berubah (misal, load dari localStorage)
  useEffect(() => {
    if (props.inMaterial) {
      setInMaterialState(props.inMaterial);
      // Mark days that have data as having user input
      const daysWithData = new Set<number>();
      props.inMaterial.forEach((dayData, dayIdx) => {
        if (dayData && (dayData[0] !== null || dayData[1] !== null)) {
          daysWithData.add(dayIdx);
        }
      });
      setDaysWithUserInput(daysWithData);
    }
  }, [props.inMaterial]);

  // Sinkronisasi aktualInMaterial dari props
  useEffect(() => {
    if (props.aktualInMaterial) {
      // Mark days that have aktual data as having user input
      const daysWithAktualData = new Set<number>();
      props.aktualInMaterial.forEach((dayData, dayIdx) => {
        if (dayData && (dayData[0] !== null || dayData[1] !== null)) {
          daysWithAktualData.add(dayIdx);
        }
      });
      setDaysWithUserInput((prev) => new Set([...prev, ...daysWithAktualData]));
    }
  }, [props.aktualInMaterial]);

  // Ensure inMaterialState is properly initialized for all days
  const inMaterial = React.useMemo(() => {
    // Create a new array with proper structure for all days
    const result = Array.from({ length: props.days }, (_, dayIdx) => {
      // Use existing data if available, otherwise create new array
      const existingData = inMaterialState[dayIdx];
      if (existingData) {
        return [...existingData]; // Copy to avoid mutation
      }
      return [null, null]; // Default for new days
    });
    return result;
  }, [inMaterialState, props.days]);

  // Ensure aktualInMaterial is properly initialized for all days
  const aktualInMaterial = React.useMemo(() => {
    const propsAktualInMaterial =
      props.aktualInMaterial ??
      Array.from({ length: props.days }, () => [null, null]);

    // Create a new array with proper structure for all days
    const result = Array.from({ length: props.days }, (_, dayIdx) => {
      // Use existing data if available, otherwise create new array
      const existingData = propsAktualInMaterial[dayIdx];
      if (existingData) {
        return [...existingData]; // Copy to avoid mutation
      }
      return [null, null]; // Default for new days
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

  // Handler input granular - store data in the correct array for each day and shift
  const handleInMaterialChange = useCallback(
    (dayIdx: number, shiftIdx: number, value: number | null) => {
      // Update local state and immediately save to parent
      setInMaterialState((prev) => {
        const next = [...prev];
        // Ensure the day array exists
        if (!next[dayIdx]) {
          next[dayIdx] = [null, null];
        }
        // Update the specific shift value
        next[dayIdx][shiftIdx] = value;

        // Immediately save to parent component with the updated array
        if (props.onInMaterialChange) {
          props.onInMaterialChange(next);
        }

        return next;
      });

      // Mark this day as having user input
      if (value !== null) {
        setDaysWithUserInput((prev) => new Set([...prev, dayIdx]));
      }
    },
    [props.onInMaterialChange],
  );

  const handleAktualInMaterialChange = useCallback(
    (dayIdx: number, shiftIdx: number, value: number | null) => {
      if (props.onAktualInMaterialChange) {
        const currentAktualInMaterial =
          props.aktualInMaterial ??
          Array.from({ length: props.days }, () => [null, null]);
        const updated = [...currentAktualInMaterial];

        // Ensure the day array exists
        if (!updated[dayIdx]) {
          updated[dayIdx] = [null, null];
        }

        // Update the specific shift value
        updated[dayIdx][shiftIdx] = value;

        // Immediately save to parent component
        props.onAktualInMaterialChange(updated);
      }

      // Mark this day as having user input
      if (value !== null) {
        setDaysWithUserInput((prev) => new Set([...prev, dayIdx]));
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

  // Helper untuk dapatkan nama hari dari urutan hari ke-d (mulai Senin)
  const getDayName = (day: number) => {
    // Misal hari ke-1 = Senin, dst. (bisa diubah sesuai kebutuhan)
    // Di gambar, hari ke-1 = Selasa, jadi offset = 2
    const offset = 2; // 0=Minggu, 1=Senin, 2=Selasa, dst
    return DAY_NAMES[(offset + day) % 7];
  };

  // Render baris sesuai filter
  const renderFilteredContent = () => {
    // Jika tidak ada filter aktif, tampilkan semua konten
    if (!props.activeFilter || props.activeFilter.length === 0) {
      return (
        <>
          {/* Header Info */}
          <div className="text-center mb-6">
            <div className={`text-lg font-medium ${uiColors.text.secondary}`}>
              Data Child Part - Semua Hari
            </div>
          </div>

          {/* In Material - All Days */}
          <div className="space-y-4">
            <h3
              className={`text-lg font-semibold ${uiColors.text.primary} flex items-center gap-2`}
            >
              <Layers className="w-5 h-5 text-blue-400" />
              Rencana In Material - Semua Hari
            </h3>
            <div
              className={`${uiColors.bg.secondary} rounded-lg p-6 ${uiColors.border.secondary}`}
            >
              <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                {Array.from({ length: props.days }, (_, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="border-b border-gray-300 dark:border-gray-600 pb-4 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium ${uiColors.text.primary}`}
                      >
                        Hari {dayIdx + 1} ({getDayName(dayIdx)})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-xs ${uiColors.text.tertiary} mb-1`}
                        >
                          Shift 1
                        </label>
                        <InputCell
                          key={`rencana-shift1-day${dayIdx}`}
                          value={inMaterial[dayIdx][0]}
                          onChange={(v) => handleInMaterialChange(dayIdx, 0, v)}
                          className={`w-full px-3 py-2 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-xs ${uiColors.text.tertiary} mb-1`}
                        >
                          Shift 2
                        </label>
                        <InputCell
                          key={`rencana-shift2-day${dayIdx}`}
                          value={inMaterial[dayIdx][1]}
                          onChange={(v) => handleInMaterialChange(dayIdx, 1, v)}
                          className={`w-full px-3 py-2 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Aktual In Material - All Days */}
          <div className="space-y-4 mt-6">
            <h3
              className={`text-lg font-semibold ${uiColors.text.primary} flex items-center gap-2`}
            >
              <Layers className="w-5 h-5 text-green-400" />
              Aktual In Material - Semua Hari
            </h3>
            <div
              className={`${uiColors.bg.secondary} rounded-lg p-6 ${uiColors.border.secondary}`}
            >
              <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                {Array.from({ length: props.days }, (_, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="border-b border-gray-300 dark:border-gray-600 pb-4 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium ${uiColors.text.primary}`}
                      >
                        Hari {dayIdx + 1} ({getDayName(dayIdx)})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-xs ${uiColors.text.tertiary} mb-1`}
                        >
                          Shift 1
                        </label>
                        <InputCell
                          key={`aktual-shift1-day${dayIdx}`}
                          value={aktualInMaterial[dayIdx][0]}
                          onChange={(v) =>
                            handleAktualInMaterialChange(dayIdx, 0, v)
                          }
                          className={`w-full px-3 py-2 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm`}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-xs ${uiColors.text.tertiary} mb-1`}
                        >
                          Shift 2
                        </label>
                        <InputCell
                          key={`aktual-shift2-day${dayIdx}`}
                          value={aktualInMaterial[dayIdx][1]}
                          onChange={(v) =>
                            handleAktualInMaterialChange(dayIdx, 1, v)
                          }
                          className={`w-full px-3 py-2 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rencana Stock - All Days */}
          <div className="space-y-4 mt-6">
            <h3
              className={`text-lg font-semibold ${uiColors.text.primary} flex items-center gap-2`}
            >
              <TrendingUp className="w-5 h-5 text-green-400" />
              Rencana Stock (PCS) - Semua Hari
            </h3>
            <div
              className={`${uiColors.bg.secondary} rounded-lg p-6 ${uiColors.border.secondary}`}
            >
              <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                {Array.from({ length: props.days }, (_, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="border-b border-gray-300 dark:border-gray-600 pb-4 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium ${uiColors.text.primary}`}
                      >
                        Hari {dayIdx + 1} ({getDayName(dayIdx)})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-xs ${uiColors.text.tertiary} mb-1`}
                        >
                          Shift 1
                        </label>
                        <div
                          className={`w-full px-3 py-2 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center text-sm ${rencanaStock[dayIdx * 2] < 0 ? "text-red-600 font-bold" : rencanaStock[dayIdx * 2] > 0 ? "text-green-400 font-bold" : uiColors.text.primary}`}
                        >
                          {rencanaStock[dayIdx * 2]?.toFixed(0) || "0"}
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-xs ${uiColors.text.tertiary} mb-1`}
                        >
                          Shift 2
                        </label>
                        <div
                          className={`w-full px-3 py-2 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center text-sm ${rencanaStock[dayIdx * 2 + 1] < 0 ? "text-red-600 font-bold" : rencanaStock[dayIdx * 2 + 1] > 0 ? "text-green-400 font-bold" : uiColors.text.primary}`}
                        >
                          {rencanaStock[dayIdx * 2 + 1]?.toFixed(0) || "0"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Aktual Stock - All Days */}
          <div className="space-y-4 mt-6">
            <h3
              className={`text-lg font-semibold ${uiColors.text.primary} flex items-center gap-2`}
            >
              <TrendingDown className="w-5 h-5 text-red-400" />
              Aktual Stock (PCS) - Semua Hari
            </h3>
            <div
              className={`${uiColors.bg.secondary} rounded-lg p-6 ${uiColors.border.secondary}`}
            >
              <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                {Array.from({ length: props.days }, (_, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="border-b border-gray-300 dark:border-gray-600 pb-4 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium ${uiColors.text.primary}`}
                      >
                        Hari {dayIdx + 1} ({getDayName(dayIdx)})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-xs ${uiColors.text.tertiary} mb-1`}
                        >
                          Shift 1
                        </label>
                        <div
                          className={`w-full px-3 py-2 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center text-sm ${aktualStock[dayIdx * 2] < 0 ? "text-red-600 font-bold" : aktualStock[dayIdx * 2] > 0 ? "text-green-400 font-bold" : uiColors.text.primary}`}
                        >
                          {aktualStock[dayIdx * 2]?.toFixed(0) || "0"}
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-xs ${uiColors.text.tertiary} mb-1`}
                        >
                          Shift 2
                        </label>
                        <div
                          className={`w-full px-3 py-2 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center text-sm ${aktualStock[dayIdx * 2 + 1] < 0 ? "text-red-600 font-bold" : aktualStock[dayIdx * 2 + 1] > 0 ? "text-green-400 font-bold" : uiColors.text.primary}`}
                        >
                          {aktualStock[dayIdx * 2 + 1]?.toFixed(0) || "0"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      );
    }

    // Jika ada filter aktif, tampilkan konten sesuai filter yang dipilih
    return (
      <>
        {/* Header Info */}
        <div className="text-center mb-6">
          <div className={`text-lg font-medium ${uiColors.text.secondary}`}>
            Data Child Part - Filter Aktif
          </div>
        </div>

        {/* Render konten sesuai filter yang dipilih */}
        {props.activeFilter.includes("rencanaInMaterial") && (
          <div className="space-y-4">
            <h3
              className={`text-lg font-semibold ${uiColors.text.primary} flex items-center gap-2`}
            >
              <Layers className="w-5 h-5 text-blue-400" />
              Rencana In Material - Semua Hari
            </h3>
            <div
              className={`${uiColors.bg.secondary} rounded-lg p-6 ${uiColors.border.secondary}`}
            >
              <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                {Array.from({ length: props.days }, (_, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="border-b border-gray-300 dark:border-gray-600 pb-4 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium ${uiColors.text.primary}`}
                      >
                        Hari {dayIdx + 1} ({getDayName(dayIdx)})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-xs ${uiColors.text.tertiary} mb-1`}
                        >
                          Shift 1
                        </label>
                        <InputCell
                          key={`rencana-shift1-day${dayIdx}`}
                          value={inMaterial[dayIdx][0]}
                          onChange={(v) => handleInMaterialChange(dayIdx, 0, v)}
                          className={`w-full px-3 py-2 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-xs ${uiColors.text.tertiary} mb-1`}
                        >
                          Shift 2
                        </label>
                        <InputCell
                          key={`rencana-shift2-day${dayIdx}`}
                          value={inMaterial[dayIdx][1]}
                          onChange={(v) => handleInMaterialChange(dayIdx, 1, v)}
                          className={`w-full px-3 py-2 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {props.activeFilter.includes("aktualInMaterial") && (
          <div className="space-y-4 mt-6">
            <h3
              className={`text-lg font-semibold ${uiColors.text.primary} flex items-center gap-2`}
            >
              <Layers className="w-5 h-5 text-green-400" />
              Aktual In Material - Semua Hari
            </h3>
            <div
              className={`${uiColors.bg.secondary} rounded-lg p-6 ${uiColors.border.secondary}`}
            >
              <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                {Array.from({ length: props.days }, (_, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="border-b border-gray-300 dark:border-gray-600 pb-4 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium ${uiColors.text.primary}`}
                      >
                        Hari {dayIdx + 1} ({getDayName(dayIdx)})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-xs ${uiColors.text.tertiary} mb-1`}
                        >
                          Shift 1
                        </label>
                        <InputCell
                          key={`aktual-shift1-day${dayIdx}`}
                          value={aktualInMaterial[dayIdx][0]}
                          onChange={(v) =>
                            handleAktualInMaterialChange(dayIdx, 0, v)
                          }
                          className={`w-full px-3 py-2 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm`}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-xs ${uiColors.text.tertiary} mb-1`}
                        >
                          Shift 2
                        </label>
                        <InputCell
                          key={`aktual-shift2-day${dayIdx}`}
                          value={aktualInMaterial[dayIdx][1]}
                          onChange={(v) =>
                            handleAktualInMaterialChange(dayIdx, 1, v)
                          }
                          className={`w-full px-3 py-2 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {props.activeFilter.includes("rencanaStock") && (
          <div className="space-y-4 mt-6">
            <h3
              className={`text-lg font-semibold ${uiColors.text.primary} flex items-center gap-2`}
            >
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Rencana Stock (PCS) - Semua Hari
            </h3>
            <div
              className={`${uiColors.bg.secondary} rounded-lg p-6 ${uiColors.border.secondary}`}
            >
              <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                {Array.from({ length: props.days }, (_, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="border-b border-gray-300 dark:border-gray-600 pb-4 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium ${uiColors.text.primary}`}
                      >
                        Hari {dayIdx + 1} ({getDayName(dayIdx)})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-xs ${uiColors.text.tertiary} mb-1`}
                        >
                          Shift 1
                        </label>
                        <div
                          className={`w-full px-3 py-2 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center text-sm ${rencanaStock[dayIdx * 2] < 0 ? "text-red-600 font-bold" : rencanaStock[dayIdx * 2] > 0 ? "text-green-400 font-bold" : uiColors.text.primary}`}
                        >
                          {rencanaStock[dayIdx * 2]?.toFixed(0) || "0"}
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-xs ${uiColors.text.tertiary} mb-1`}
                        >
                          Shift 2
                        </label>
                        <div
                          className={`w-full px-3 py-2 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center text-sm ${rencanaStock[dayIdx * 2 + 1] < 0 ? "text-red-600 font-bold" : rencanaStock[dayIdx * 2 + 1] > 0 ? "text-green-400 font-bold" : uiColors.text.primary}`}
                        >
                          {rencanaStock[dayIdx * 2 + 1]?.toFixed(0) || "0"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {props.activeFilter.includes("aktualStock") && (
          <div className="space-y-4 mt-6">
            <h3
              className={`text-lg font-semibold ${uiColors.text.primary} flex items-center gap-2`}
            >
              <TrendingDown className="w-5 h-5 text-red-400" />
              Aktual Stock (PCS) - Semua Hari
            </h3>
            <div
              className={`${uiColors.bg.secondary} rounded-lg p-6 ${uiColors.border.secondary}`}
            >
              <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                {Array.from({ length: props.days }, (_, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="border-b border-gray-300 dark:border-gray-600 pb-4 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium ${uiColors.text.primary}`}
                      >
                        Hari {dayIdx + 1} ({getDayName(dayIdx)})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-xs ${uiColors.text.tertiary} mb-1`}
                        >
                          Shift 1
                        </label>
                        <div
                          className={`w-full px-3 py-2 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center text-sm ${aktualStock[dayIdx * 2] < 0 ? "text-red-600 font-bold" : aktualStock[dayIdx * 2] > 0 ? "text-green-400 font-bold" : uiColors.text.primary}`}
                        >
                          {aktualStock[dayIdx * 2]?.toFixed(0) || "0"}
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-xs ${uiColors.text.tertiary} mb-1`}
                        >
                          Shift 2
                        </label>
                        <div
                          className={`w-full px-3 py-2 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center text-sm ${aktualStock[dayIdx * 2 + 1] < 0 ? "text-red-600 font-bold" : aktualStock[dayIdx * 2 + 1] > 0 ? "text-green-400 font-bold" : uiColors.text.primary}`}
                        >
                          {aktualStock[dayIdx * 2 + 1]?.toFixed(0) || "0"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const handleDeleteClick = () => setShowDeleteModal(true);
  const handleDeleteConfirm = async () => {
    setShowDeleteModal(false);
    if (props.onDelete) {
      props.onDelete();
    }
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
    if (props.onEdit) {
      props.onEdit(data);
    }
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

  return (
    <div className="mt-6">
      {/* Header Info */}
      <div className="p-4 pb-2 bg-gray-200 dark:bg-gray-700 rounded-t-xl flex flex-col gap-4 border border-gray-300 dark:border-gray-600 border-b-0 relative">
        {/* Main Header Content */}
        <div className="flex flex-col gap-4">
          {/* Top Row: Title and Action Buttons */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="text-gray-900 dark:text-white font-bold text-lg">
                {props.partName}
              </span>
            </div>

            {/* Action Buttons - Sticky to top-right */}
            <div className="flex gap-2 items-center flex-shrink-0">
              {/* Edit Part Button */}
              <button
                onClick={handleEditPart}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all flex items-center gap-2"
                title="Edit Part"
              >
                <Edit className="w-4 h-4" />
                <span className="text-sm font-medium">Edit</span>
              </button>

              {/* Edit Schedule Button */}
              {props.onEditSchedule && (
                <button
                  onClick={handleEditSchedule}
                  className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-green-400 transition-all flex items-center gap-2"
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
                  className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all flex items-center gap-2"
                  title="Hapus Jadwal"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Hapus Jadwal</span>
                </button>
              )}
            </div>
          </div>

          {/* Customer Info - Sticky position */}
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-semibold text-sm">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-1" />
              {props.customerName}
            </span>
          </div>

          {/* Material Info Panels dengan Delete Button */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-lg text-blue-800 dark:text-blue-200 font-semibold text-sm">
                  <Package className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-1" />
                  Stock Awal Tersedia:
                  <span className="ml-1 font-bold">
                    {props.initialStock === null
                      ? "-"
                      : props.initialStock.toLocaleString()}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg text-green-800 dark:text-green-200 font-semibold text-sm">
                  <Layers className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
                  Total Rencana In Material:
                  <span className="ml-1 font-bold">
                    {totalInMaterial.toLocaleString()}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg text-yellow-800 dark:text-yellow-200 font-semibold text-sm">
                  <Layers className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-1" />
                  Total Aktual In Material:
                  <span className="ml-1 font-bold">
                    {totalAktualInMaterial.toLocaleString()}
                  </span>
                </span>
              </div>

              {/* Delete Button */}
              {props.renderHeaderAction && (
                <button
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200"
                  onClick={handleDeleteClick}
                  type="button"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="bg-gray-200 dark:bg-gray-700 rounded-b-xl border border-gray-300 dark:border-gray-600 border-t-0">
        <div className="p-4 pt-2">{renderFilteredContent()}</div>
      </div>

      {/* Edit Part Modal */}
      <ChildPart
        isOpen={showEditPartModal}
        onClose={() => setShowEditPartModal(false)}
        onGenerate={() => {}}
        onEdit={handleEditPartSubmit}
        initialData={{
          partName: props.partName,
          customerName: props.customerName,
          stock: props.initialStock,
        }}
        isEditMode={true}
      />
      {loading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus part ini?"
      />
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
        message="Apakah Anda yakin ingin menghapus jadwal untuk hari ini?"
      />
    </div>
  );
};

export default memo(ChildPartCardView);
