import React, { useState, useEffect, useMemo, useCallback } from "react";
import { User, Package, Layers, TrendingUp, TrendingDown } from "lucide-react";
import { memo } from "react";
import { useTheme } from "../../../contexts/ThemeContext";

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
  onEdit?: () => void;
  inMaterial?: (number|null)[][];
  onInMaterialChange?: (val: (number|null)[][]) => void;
  aktualInMaterial?: (number|null)[][];
  onAktualInMaterialChange?: (val: (number|null)[][]) => void;
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
const InputCell = memo(function InputCell({ value, onChange, className }: { value: number | null, onChange: (val: number | null) => void, className: string }) {
  return (
    <input
      type="number"
      min={0}
      value={value ?? ""}
      onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))}
      className={className}
    />
  );
});

const Modal: React.FC<{ open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; }> = ({ open, onClose, onConfirm, title, message }) => {
  const { uiColors } = useTheme();
  
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className={`${uiColors.bg.modal} rounded-2xl p-8 ${uiColors.border.primary} max-w-sm w-full`}>
        <h2 className={`text-xl font-bold ${uiColors.text.primary} mb-2`}>{title}</h2>
        <p className={`${uiColors.text.secondary} mb-6`}>{message}</p>
        <div className="flex gap-4 justify-end">
          <button onClick={onClose} className={`px-4 py-2 rounded ${uiColors.button.secondary.bg} ${uiColors.button.secondary.hover} ${uiColors.button.secondary.text} ${uiColors.button.secondary.border}`}>Batal</button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded ${uiColors.button.danger.bg} ${uiColors.button.danger.hover} ${uiColors.button.danger.text} ${uiColors.button.danger.border}`}>Hapus</button>
        </div>
      </div>
    </div>
  );
};

const ChildPartTable: React.FC<ChildPartTableProps> = (props) => {
  const { uiColors } = useTheme();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // In Material per shift per hari: [ [shift1, shift2], ... ]
  const [inMaterialState, setInMaterialState] = useState<(number|null)[][]>(
    props.inMaterial ?? Array.from({ length: props.days }, () => [null, null])
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
        return [base[dayIdx][0] ?? null, base[dayIdx][1] ?? null];
      }
      return [null, null];
    });
    return result;
  }, [props.inMaterial, inMaterialState, props.days]);

  // State aktualInMaterial benar-benar independen - now using props
  // const [aktualInMaterialState, setAktualInMaterialState] = useState<(number|null)[][]>(
  //   Array.from({ length: props.days }, () => [null, null])
  // );
  
  // Ensure aktualInMaterial is properly initialized for all days
  const aktualInMaterial = React.useMemo(() => {
    const base = props.aktualInMaterial ?? Array.from({ length: props.days }, () => [null, null]);
    // Ensure array has correct length and all days are initialized
    const result = Array.from({ length: props.days }, (_, dayIdx) => {
      if (base[dayIdx] && Array.isArray(base[dayIdx])) {
        return [base[dayIdx][0] ?? null, base[dayIdx][1] ?? null];
      }
      return [null, null];
    });
    return result;
  }, [props.aktualInMaterial, props.days]);

  // Gunakan 0 jika initialStock null
  const safeInitialStock = props.initialStock ?? 0;

  // Helper: ambil hasil produksi, planning, overtime dari schedule
  const getScheduleData = (dayIdx: number, shiftIdx: number) => {
    const shiftStr = shiftIdx === 0 ? "1" : "2";
    const item = props.schedule.find(
      (s) => s.day === dayIdx + 1 && s.shift === shiftStr
    );
    return {
      hasilProduksi: item ? item.pcs : 0,
      planningPcs: item && typeof item.planningPcs === "number" ? item.planningPcs : 0,
      overtimePcs: item && typeof item.overtimePcs === "number" ? item.overtimePcs : 0,
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
          rencanaStock[idx] = safeInitialStock + (inMaterial[d][s] ?? 0) - (planningPcs + overtimePcs);
        } else {
          // All subsequent shifts/days: use previous stock + current input - (planning + overtime)
          rencanaStock[idx] = rencanaStock[idx - 1] + (inMaterial[d][s] ?? 0) - (planningPcs + overtimePcs);
        }
      } else {
        // If Hasil Produksi != 0, use Previous Stock + Rencana In Material - Hasil Produksi
        if (idx === 0) {
          // First shift of first day: use initial stock
          rencanaStock[idx] = safeInitialStock + (inMaterial[d][s] ?? 0) - hasilProduksi;
        } else {
          // All subsequent shifts/days: use previous stock + current input - actual production
          rencanaStock[idx] = rencanaStock[idx - 1] + (inMaterial[d][s] ?? 0) - hasilProduksi;
        }
      }
    }
  }

  // Hitung total in material sebulan
  const totalInMaterial = inMaterial.reduce((sum, arr) => sum + (arr[0] ?? 0) + (arr[1] ?? 0), 0);
  // Hitung total aktual in material sebulan
  const totalAktualInMaterial = aktualInMaterial.reduce((sum, arr) => sum + (arr[0] ?? 0) + (arr[1] ?? 0), 0);

  // Handler input granular
  const handleInMaterialChange = useCallback((dayIdx: number, shiftIdx: number, value: number | null) => {
    setInMaterialState(prev => {
      if (prev[dayIdx][shiftIdx] === value) return prev;
      const next = prev.map((arr, i) => i === dayIdx ? [...arr] : arr);
      next[dayIdx][shiftIdx] = value;
      if (props.onInMaterialChange) props.onInMaterialChange(next);
      return next;
    });
  }, [props.onInMaterialChange]);
  const handleAktualInMaterialChange = useCallback((dayIdx: number, shiftIdx: number, value: number | null) => {
    if (props.onAktualInMaterialChange) {
      const currentAktualInMaterial = props.aktualInMaterial ?? Array.from({ length: props.days }, () => [null, null]);
      const updated = currentAktualInMaterial.map((arr, i) => i === dayIdx ? [...arr] : arr);
      updated[dayIdx][shiftIdx] = value;
      props.onAktualInMaterialChange(updated);
    }
  }, [props.onAktualInMaterialChange, props.aktualInMaterial, props.days]);

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
          aktualStock[idx] = safeInitialStock + aktualIn - (planningPcs + overtimePcs);
        } else {
          // All subsequent shifts/days: use previous stock + current input - (planning + overtime)
          aktualStock[idx] = aktualStock[idx - 1] + aktualIn - (planningPcs + overtimePcs);
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

  // Wrap delete
  const handleDeleteClick = () => setShowDeleteModal(true);
  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    if (props.onDelete) props.onDelete();
  };

  // Loading logic for navigation/filter
  // If you have navigation/filter change, wrap setState with:
  // setLoading(true); setTimeout(() => { ...setState...; setLoading(false); }, 500);

  // Input reset effect - ensure all days are properly initialized
  useEffect(() => {
    // Ensure inMaterialState is properly initialized for all days
    setInMaterialState(prev => {
      const next = [...prev];
      // Initialize any missing days with [null, null]
      for (let i = 0; i < props.days; i++) {
        if (!next[i]) {
          next[i] = [null, null];
        }
      }
      return next;
    });
    
    // Note: aktualInMaterial is now managed by props, so no local state reset needed
  }, [props.days]); // Run when days prop changes



  return (
    <div className="mt-6">
      {/* Header Info (freeze, di luar overflow-x-auto) */}
      <div className={`p-4 pb-2 ${uiColors.bg.tertiary} rounded-t-xl flex flex-col gap-4 ${uiColors.border.primary} border-b-0 relative`}>
        {/* Main Header Content */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center gap-3">
            <span className={`${uiColors.text.primary} font-bold text-lg`}>
              {props.partName}
            </span>
          </div>
          <div className="flex flex-row flex-wrap gap-3 items-center">
            <span className={`inline-flex items-center gap-1 px-3 py-1 ${uiColors.bg.secondary} ${uiColors.border.secondary} rounded-lg ${uiColors.text.secondary} font-semibold text-sm`}>
              <User className="w-4 h-4 text-emerald-400 mr-1" />
              {props.customerName}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900 border border-blue-700 rounded-lg text-blue-200 font-semibold text-sm">
              <Package className="w-4 h-4 text-blue-400 mr-1" />
              Stock Awal Tersedia:
              <span className="ml-1 font-bold">{props.initialStock === null ? '-' : props.initialStock.toLocaleString()}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-900 border border-green-700 rounded-lg text-green-200 font-semibold text-sm">
              <Layers className="w-4 h-4 text-green-400 mr-1" />
              Total Rencana In Material:
              <span className="ml-1 font-bold">{totalInMaterial.toLocaleString()}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-900 border border-yellow-700 rounded-lg text-yellow-200 font-semibold text-sm">
              <Layers className="w-4 h-4 text-yellow-400 mr-1" />
              Total Aktual In Material:
              <span className="ml-1 font-bold">{totalAktualInMaterial.toLocaleString()}</span>
            </span>
          </div>
        </div>
        
        {/* Action Buttons - Moved to top right */}
        {props.renderHeaderAction && (
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              className={`px-3 py-1 ${uiColors.button.primary.bg} ${uiColors.button.primary.hover} ${uiColors.button.primary.text} rounded-lg text-sm font-medium transition-all duration-200`}
              onClick={props.onEdit}
              type="button"
              title="Edit"
            >
              Edit
            </button>
            <button
              className={`px-3 py-1 ${uiColors.button.danger.bg} ${uiColors.button.danger.hover} ${uiColors.button.danger.text} rounded-lg text-sm font-medium transition-all duration-200`}
              onClick={handleDeleteClick}
              type="button"
              title="Delete"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className={`overflow-x-auto ${uiColors.bg.tertiary} rounded-b-xl ${uiColors.border.primary} border-t-0`}>
        <div className="p-4 pt-2">
          <table className="min-w-max w-full text-sm text-center">
            {/* Header Row */}
            <thead>
              <tr className={`${uiColors.bg.secondary} ${uiColors.text.secondary}`}>
                <th
                  className={`p-2 font-semibold align-bottom sticky left-0 z-30 ${uiColors.bg.secondary} ${uiColors.border.secondary} border-r`}
                  rowSpan={2}
                  style={{ minWidth: 140 }}
                >
                  KETERANGAN
                </th>
                {/* Kolom hari utama */}
                {Array.from({ length: props.days }, (_, i) => (
                  <th
                    key={i}
                    className={`p-2 font-semibold align-bottom sticky top-0 z-20 ${uiColors.bg.secondary}`}
                    colSpan={2}
                    style={{ minWidth: 110 }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-base font-bold">{getDayName(i)} </span>
                      <span className="text-lg font-bold">{i + 1}</span>
                    </div>
                  </th>
                ))}
              </tr>
              <tr className={`${uiColors.bg.secondary} ${uiColors.text.tertiary}`}>
                {Array.from({ length: props.days }, (_, i) => [
                  <th
                    key={`shift1-${i}`}
                    className={`p-1 font-semibold sticky top-10 z-10 ${uiColors.bg.secondary}`}
                    style={{ minWidth: 80 }}
                  >
                    <span className="bg-blue-700 text-white px-2 py-1 rounded">SHIFT 1</span>
                  </th>,
                  <th
                    key={`shift2-${i}`}
                    className={`p-1 font-semibold sticky top-10 z-10 ${uiColors.bg.secondary}`}
                    style={{ minWidth: 80 }}
                  >
                    <span className="bg-purple-700 text-white px-2 py-1 rounded">SHIFT 2</span>
                  </th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {/* Render baris sesuai filter */}
              {(!props.activeFilter || props.activeFilter.length === 0) && (
                <>
                  {/* In Material */}
                  <tr>
                    <td className={`p-2 ${uiColors.bg.secondary} ${uiColors.text.primary} font-semibold sticky left-0 z-20 ${uiColors.border.secondary} border-r`} style={{ minWidth: 140 }}>
                      RENCANA IN MATERIAL
                    </td>
                    {inMaterial.map((val, dayIdx) => [
                      <td key={`inmat-1-${dayIdx}`} className="p-2">
                        <InputCell
                          key={`rencana-table-shift1-day${dayIdx}`}
                          value={val[0]}
                          onChange={v => handleInMaterialChange(dayIdx, 0, v)}
                          className={`w-16 px-2 py-1 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </td>,
                      <td key={`inmat-2-${dayIdx}`} className="p-2">
                        <InputCell
                          key={`rencana-table-shift2-day${dayIdx}`}
                          value={val[1]}
                          onChange={v => handleInMaterialChange(dayIdx, 1, v)}
                          className={`w-16 px-2 py-1 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </td>,
                    ])}
                  </tr>
                  {/* Aktual In Material */}
                  <tr>
                    <td className={`p-2 ${uiColors.bg.secondary} ${uiColors.text.primary} font-semibold sticky left-0 z-20 ${uiColors.border.secondary} border-r`} style={{ minWidth: 140 }}>
                      AKTUAL IN MATERIAL
                    </td>
                    {aktualInMaterial.map((val, dayIdx) => [
                      <td key={`aktualinmat-1-${dayIdx}`} className="p-2">
                        <InputCell
                          key={`aktual-table-shift1-day${dayIdx}`}
                          value={val[0]}
                          onChange={v => handleAktualInMaterialChange(dayIdx, 0, v)}
                          className={`w-16 px-2 py-1 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                        />
                      </td>,
                      <td key={`aktualinmat-2-${dayIdx}`} className="p-2">
                        <InputCell
                          key={`aktual-table-shift2-day${dayIdx}`}
                          value={val[1]}
                          onChange={v => handleAktualInMaterialChange(dayIdx, 1, v)}
                          className={`w-16 px-2 py-1 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                        />
                      </td>,
                    ])}
                  </tr>
                  {/* Rencana Stock */}
                  <tr>
                    <td className={`p-2 ${uiColors.bg.secondary} ${uiColors.text.primary} font-semibold sticky left-0 z-20 ${uiColors.border.secondary} border-r`} style={{ minWidth: 140 }}>
                      RENCANA STOCK (PCS)
                    </td>
                    {Array.from({ length: props.days }, (_, dayIdx) => [
                      <td key={`rencana-1-${dayIdx}`} className={`p-2 font-mono ${rencanaStock[dayIdx * 2] < 0 ? 'text-red-600 font-bold' : rencanaStock[dayIdx * 2] > 0 ? 'text-green-400 font-bold' : uiColors.text.primary}`}>
                        {rencanaStock[dayIdx * 2]?.toFixed(0) || "0"}
                      </td>,
                      <td key={`rencana-2-${dayIdx}`} className={`p-2 font-mono ${rencanaStock[dayIdx * 2 + 1] < 0 ? 'text-red-600 font-bold' : rencanaStock[dayIdx * 2 + 1] > 0 ? 'text-green-400 font-bold' : uiColors.text.primary}`}>
                        {rencanaStock[dayIdx * 2 + 1]?.toFixed(0) || "0"}
                      </td>,
                    ])}
                  </tr>
                  {/* Aktual Stock */}
                  <tr>
                    <td className={`p-2 ${uiColors.bg.secondary} ${uiColors.text.primary} font-semibold sticky left-0 z-20 ${uiColors.border.secondary} border-r`} style={{ minWidth: 140 }}>
                      AKTUAL STOCK (PCS)
                    </td>
                    {Array.from({ length: props.days }, (_, dayIdx) => [
                      <td key={`aktualstock-1-${dayIdx}`} className={`p-2 font-mono ${aktualStock[dayIdx * 2] < 0 ? 'text-red-600 font-bold' : aktualStock[dayIdx * 2] > 0 ? 'text-green-400 font-bold' : uiColors.text.primary}`}>
                        {aktualStock[dayIdx * 2]?.toFixed(0) || "0"}
                      </td>,
                      <td key={`aktualstock-2-${dayIdx}`} className={`p-2 font-mono ${aktualStock[dayIdx * 2 + 1] < 0 ? 'text-red-600 font-bold' : aktualStock[dayIdx * 2 + 1] > 0 ? 'text-green-400 font-bold' : uiColors.text.primary}`}>
                        {aktualStock[dayIdx * 2 + 1]?.toFixed(0) || "0"}
                      </td>,
                    ])}
                  </tr>
                </>
              )}
              {props.activeFilter && props.activeFilter.includes("rencanaInMaterial") && (
                <tr>
                  <td className={`p-2 ${uiColors.bg.secondary} ${uiColors.text.primary} font-semibold sticky left-0 z-20 ${uiColors.border.secondary} border-r`} style={{ minWidth: 140 }}>
                    RENCANA IN MATERIAL
                  </td>
                  {inMaterial.map((val, dayIdx) => [
                    <td key={`inmat-1-${dayIdx}`} className="p-2">
                      <InputCell
                        key={`rencana-filtered-shift1-day${dayIdx}`}
                        value={val[0]}
                        onChange={v => handleInMaterialChange(dayIdx, 0, v)}
                        className={`w-16 px-2 py-1 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </td>,
                    <td key={`inmat-2-${dayIdx}`} className="p-2">
                      <InputCell
                        key={`rencana-filtered-shift2-day${dayIdx}`}
                        value={val[1]}
                        onChange={v => handleInMaterialChange(dayIdx, 1, v)}
                        className={`w-16 px-2 py-1 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </td>,
                  ])}
                </tr>
              )}
              {props.activeFilter && props.activeFilter.includes("aktualInMaterial") && (
                <tr>
                  <td className={`p-2 ${uiColors.bg.secondary} ${uiColors.text.primary} font-semibold sticky left-0 z-20 ${uiColors.border.secondary} border-r`} style={{ minWidth: 140 }}>
                    AKTUAL IN MATERIAL
                  </td>
                  {aktualInMaterial.map((val, dayIdx) => [
                    <td key={`aktualinmat-1-${dayIdx}`} className="p-2">
                      <InputCell
                        key={`aktual-filtered-shift1-day${dayIdx}`}
                        value={val[0]}
                        onChange={v => handleAktualInMaterialChange(dayIdx, 0, v)}
                        className={`w-16 px-2 py-1 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                      />
                    </td>,
                    <td key={`aktualinmat-2-${dayIdx}`} className="p-2">
                      <InputCell
                        key={`aktual-filtered-shift2-day${dayIdx}`}
                        value={val[1]}
                        onChange={v => handleAktualInMaterialChange(dayIdx, 1, v)}
                        className={`w-16 px-2 py-1 rounded ${uiColors.bg.primary} ${uiColors.border.secondary} ${uiColors.text.primary} text-center focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                      />
                    </td>,
                  ])}
                </tr>
              )}
              {props.activeFilter && props.activeFilter.includes("rencanaStock") && (
                <tr>
                  <td className={`p-2 ${uiColors.bg.secondary} ${uiColors.text.primary} font-semibold sticky left-0 z-20 ${uiColors.border.secondary} border-r`} style={{ minWidth: 140 }}>
                    RENCANA STOCK (PCS)
                  </td>
                  {Array.from({ length: props.days }, (_, dayIdx) => [
                    <td key={`rencana-1-${dayIdx}`} className={`p-2 font-mono ${rencanaStock[dayIdx * 2] < 0 ? 'text-red-600' : rencanaStock[dayIdx * 2] > 0 ? 'text-green-400 font-bold' : uiColors.text.primary}`}>
                      {rencanaStock[dayIdx * 2]?.toFixed(0) || "0"}
                    </td>,
                    <td key={`rencana-2-${dayIdx}`} className={`p-2 font-mono ${rencanaStock[dayIdx * 2 + 1] < 0 ? 'text-red-600' : rencanaStock[dayIdx * 2 + 1] > 0 ? 'text-green-400 font-bold' : uiColors.text.primary}`}>
                      {rencanaStock[dayIdx * 2 + 1]?.toFixed(0) || "0"}
                    </td>,
                  ])}
                </tr>
              )}
              {props.activeFilter && props.activeFilter.includes("aktualStock") && (
                <tr>
                  <td className={`p-2 ${uiColors.bg.secondary} ${uiColors.text.primary} font-semibold sticky left-0 z-20 ${uiColors.border.secondary} border-r`} style={{ minWidth: 140 }}>
                    AKTUAL STOCK (PCS)
                  </td>
                  {Array.from({ length: props.days }, (_, dayIdx) => [
                    <td key={`aktualstock-1-${dayIdx}`} className={`p-2 font-mono ${aktualStock[dayIdx * 2] < 0 ? 'text-red-600' : aktualStock[dayIdx * 2] > 0 ? 'text-green-400 font-bold' : uiColors.text.primary}`}>
                      {aktualStock[dayIdx * 2]?.toFixed(0) || "0"}
                    </td>,
                    <td key={`aktualstock-2-${dayIdx}`} className={`p-2 font-mono ${aktualStock[dayIdx * 2 + 1] < 0 ? 'text-red-600' : aktualStock[dayIdx * 2 + 1] > 0 ? 'text-green-400 font-bold' : uiColors.text.primary}`}>
                      {aktualStock[dayIdx * 2 + 1]?.toFixed(0) || "0"}
                    </td>,
                  ])}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus part ini?"
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default memo(ChildPartTable); 