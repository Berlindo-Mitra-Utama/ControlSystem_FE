import React, { useState, useCallback, memo } from "react";
import { Package, User, Layers, X } from "lucide-react";

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
  inMaterial?: (number|null)[][];
  onInMaterialChange?: (val: (number|null)[][]) => void;
  renderHeaderAction?: React.ReactNode;
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

const ChildPartTable: React.FC<ChildPartTableProps> = (props) => {
  // In Material per shift per hari: [ [shift1, shift2], ... ]
  const [inMaterialState, setInMaterialState] = useState<(number|null)[][]>(
    props.inMaterial ?? Array.from({ length: props.days }, () => [null, null])
  );
  // Sinkronisasi jika inMaterialProp berubah (misal, load dari localStorage)
  React.useEffect(() => {
    if (props.inMaterial) setInMaterialState(props.inMaterial);
  }, [props.inMaterial]);
  const inMaterial = props.inMaterial ?? inMaterialState;

  // State aktualInMaterial benar-benar independen
  const [aktualInMaterialState, setAktualInMaterialState] = useState<(number|null)[][]>(
    Array.from({ length: props.days }, () => [null, null])
  );
  // JANGAN ada efek yang mengubah aktualInMaterialState dari inMaterialProp
  const aktualInMaterial = aktualInMaterialState;

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
  const teoriStock: number[] = [];
  const rencanaStock: number[] = [];

  for (let d = 0; d < props.days; d++) {
    for (let s = 0; s < 2; s++) {
      const idx = d * 2 + s;
      const { hasilProduksi, planningPcs, overtimePcs } = getScheduleData(d, s);
      // Teori Stock tetap rumus lama
      if (idx === 0) {
        teoriStock[idx] = safeInitialStock + (inMaterial[d][s] ?? 0) - hasilProduksi;
      } else {
        teoriStock[idx] = teoriStock[idx - 1] + (inMaterial[d][s] ?? 0) - hasilProduksi;
      }
      // Rencana Stock pakai rumus baru
      if (idx === 0) {
        if (hasilProduksi === 0) {
          rencanaStock[idx] = safeInitialStock + (inMaterial[d][s] ?? 0) - (planningPcs + overtimePcs);
        } else {
          rencanaStock[idx] = safeInitialStock + (inMaterial[d][s] ?? 0) - hasilProduksi;
        }
      } else {
        if (hasilProduksi === 0) {
          rencanaStock[idx] = rencanaStock[idx - 1] + (inMaterial[d][s] ?? 0) - (planningPcs + overtimePcs);
        } else {
          rencanaStock[idx] = rencanaStock[idx - 1] + (inMaterial[d][s] ?? 0) - hasilProduksi;
        }
      }
    }
  }

  // Hitung total in material sebulan
  const totalInMaterial = inMaterial.reduce((sum, arr) => sum + (arr[0] ?? 0) + (arr[1] ?? 0), 0);
  // Hitung total aktual in material sebulan
  const totalAktualInMaterial = aktualInMaterialState.reduce((sum, arr) => sum + (arr[0] ?? 0) + (arr[1] ?? 0), 0);

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
    setAktualInMaterialState(prev => {
      if (prev[dayIdx][shiftIdx] === value) return prev;
      const next = prev.map((arr, i) => i === dayIdx ? [...arr] : arr);
      next[dayIdx][shiftIdx] = value;
      return next;
    });
  }, []);

  // Hitung Aktual Stock
  const aktualStock: number[] = [];
  for (let d = 0; d < props.days; d++) {
    for (let s = 0; s < 2; s++) {
      const idx = d * 2 + s;
      const { hasilProduksi } = getScheduleData(d, s);
      const aktualIn = aktualInMaterial[d][s] ?? 0;
      if (idx === 0) {
        aktualStock[idx] = safeInitialStock + aktualIn - hasilProduksi;
      } else {
        aktualStock[idx] = aktualStock[idx - 1] + aktualIn - hasilProduksi;
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

  return (
    <div className="mt-6">
      {/* Header Info (freeze, di luar overflow-x-auto) */}
      <div className="p-4 pb-2 bg-slate-900 rounded-t-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-b-0 border-slate-700 relative">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <span className="text-white font-bold text-lg flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            Material Child Part:
            <span className="text-blue-300 font-bold">{props.partName}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 font-semibold text-sm">
            <User className="w-4 h-4 text-emerald-400 mr-1" />
            {props.customerName}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900 border border-blue-700 rounded-lg text-blue-200 font-semibold text-sm">
            <Package className="w-4 h-4 text-blue-400 mr-1" />
            Stock Awal Tersedia:
            <span className="ml-1 font-bold">{props.initialStock === null ? '-' : props.initialStock.toLocaleString()}</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
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
          {props.renderHeaderAction && (
            <div className="flex gap-2 items-center ml-2">{props.renderHeaderAction}</div>
          )}
        </div>
      </div>
      {/* Table scrollable */}
      <div className="overflow-x-auto bg-slate-900 rounded-b-xl border border-t-0 border-slate-700">
        <div className="p-4 pt-2">
          <table className="min-w-max w-full text-sm text-center">
            <thead>
              <tr className="bg-slate-800 text-slate-300">
                <th
                  className="p-2 font-semibold align-bottom sticky left-0 z-30 bg-slate-800 border-r border-slate-700"
                  rowSpan={2}
                  style={{ minWidth: 140 }}
                >
                  KETERANGAN
                </th>
                {/* Kolom hari utama */}
                {Array.from({ length: props.days }, (_, i) => (
                  <th
                    key={i}
                    className="p-2 font-semibold align-bottom sticky top-0 z-20 bg-slate-800"
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
              <tr className="bg-slate-800 text-slate-400">
                {Array.from({ length: props.days }, (_, i) => [
                  <th
                    key={`shift1-${i}`}
                    className="p-1 font-semibold sticky top-10 z-10 bg-slate-800"
                    style={{ minWidth: 80 }}
                  >
                    <span className="bg-blue-700 text-white px-2 py-1 rounded">SHIFT 1</span>
                  </th>,
                  <th
                    key={`shift2-${i}`}
                    className="p-1 font-semibold sticky top-10 z-10 bg-slate-800"
                    style={{ minWidth: 80 }}
                  >
                    <span className="bg-purple-700 text-white px-2 py-1 rounded">SHIFT 2</span>
                  </th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {/* In Material */}
              <tr>
                <td className="p-2 bg-slate-800 text-slate-200 font-semibold sticky left-0 z-20 border-r border-slate-700" style={{ background: '#1e293b', minWidth: 140 }}>RENCANA IN MATERIAL</td>
                {inMaterial.map((val, dayIdx) => [
                  <td key={`inmat-1-${dayIdx}`} className="p-2">
                    <InputCell
                      value={val[0]}
                      onChange={v => handleInMaterialChange(dayIdx, 0, v)}
                      className="w-16 px-2 py-1 rounded bg-slate-700 border border-slate-600 text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </td>,
                  <td key={`inmat-2-${dayIdx}`} className="p-2">
                    <InputCell
                      value={val[1]}
                      onChange={v => handleInMaterialChange(dayIdx, 1, v)}
                      className="w-16 px-2 py-1 rounded bg-slate-700 border border-slate-600 text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </td>,
                ])}
              </tr>
              {/* Aktual In Material */}
              <tr>
                <td className="p-2 bg-slate-800 text-slate-200 font-semibold sticky left-0 z-20 border-r border-slate-700" style={{ background: '#1e293b', minWidth: 140 }}>AKTUAL IN MATERIAL</td>
                {aktualInMaterial.map((val, dayIdx) => [
                  <td key={`aktualinmat-1-${dayIdx}`} className="p-2">
                    <InputCell
                      value={val[0]}
                      onChange={v => handleAktualInMaterialChange(dayIdx, 0, v)}
                      className="w-16 px-2 py-1 rounded bg-green-700 border border-green-600 text-white text-center focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </td>,
                  <td key={`aktualinmat-2-${dayIdx}`} className="p-2">
                    <InputCell
                      value={val[1]}
                      onChange={v => handleAktualInMaterialChange(dayIdx, 1, v)}
                      className="w-16 px-2 py-1 rounded bg-green-700 border border-green-600 text-white text-center focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </td>,
                ])}
              </tr>
              {/* Rencana Stock */}
              <tr>
                <td className="p-2 bg-slate-800 text-slate-200 font-semibold sticky left-0 z-20 border-r border-slate-700" style={{ background: '#1e293b', minWidth: 140 }}>RENCANA STOCK (PCS)</td>
                {Array.from({ length: props.days }, (_, dayIdx) => [
                  <td key={`rencana-1-${dayIdx}`} className="p-2 text-green-300 font-mono">{rencanaStock[dayIdx * 2]}</td>,
                  <td key={`rencana-2-${dayIdx}`} className="p-2 text-green-300 font-mono">{rencanaStock[dayIdx * 2 + 1]}</td>,
                ])}
              </tr>
              {/* Aktual Stock */}
              <tr>
                <td className="p-2 bg-slate-800 text-slate-200 font-semibold sticky left-0 z-20 border-r border-slate-700" style={{ background: '#1e293b', minWidth: 140 }}>AKTUAL STOCK (PCS)</td>
                {Array.from({ length: props.days }, (_, dayIdx) => [
                  <td key={`aktualstock-1-${dayIdx}`} className="p-2 text-yellow-300 font-mono">{aktualStock[dayIdx * 2]}</td>,
                  <td key={`aktualstock-2-${dayIdx}`} className="p-2 text-yellow-300 font-mono">{aktualStock[dayIdx * 2 + 1]}</td>,
                ])}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default memo(ChildPartTable); 