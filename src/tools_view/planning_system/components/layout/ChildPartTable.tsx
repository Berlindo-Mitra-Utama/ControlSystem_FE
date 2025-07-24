import React, { useState } from "react";
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

const ChildPartTable: React.FC<ChildPartTableProps> = ({ partName, customerName, initialStock, days, schedule, onDelete, inMaterial: inMaterialProp, onInMaterialChange }) => {
  // In Material per shift per hari: [ [shift1, shift2], ... ]
  const [inMaterialState, setInMaterialState] = useState<(number|null)[][]>(
    inMaterialProp ?? Array.from({ length: days }, () => [null, null])
  );
  // Sinkronisasi jika inMaterialProp berubah (misal, load dari localStorage)
  React.useEffect(() => {
    if (inMaterialProp) setInMaterialState(inMaterialProp);
  }, [inMaterialProp]);
  const inMaterial = inMaterialProp ?? inMaterialState;

  // Gunakan 0 jika initialStock null
  const safeInitialStock = initialStock ?? 0;

  // Helper: ambil hasil produksi, planning, overtime dari schedule
  const getScheduleData = (dayIdx: number, shiftIdx: number) => {
    const shiftStr = shiftIdx === 0 ? "1" : "2";
    const item = schedule.find(
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

  for (let d = 0; d < days; d++) {
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

  const handleInMaterialChange = (dayIdx: number, shiftIdx: number, value: string) => {
    const next = inMaterial.map((arr) => [...arr]);
    next[dayIdx][shiftIdx] = value === "" ? null : Number(value);
    if (onInMaterialChange) {
      onInMaterialChange(next);
    } else {
      setInMaterialState(next);
    }
  };

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
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-white font-bold text-lg flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            Material Child Part:
            <span className="text-blue-300 font-bold">{partName}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 font-semibold text-sm">
            <User className="w-4 h-4 text-emerald-400 mr-1" />
            {customerName}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900 border border-blue-700 rounded-lg text-blue-200 font-semibold text-sm">
            <Package className="w-4 h-4 text-blue-400 mr-1" />
            Stock Awal Tersedia:
            <span className="ml-1 font-bold">{initialStock === null ? '-' : initialStock.toLocaleString()}</span>
          </span>
        </div>
        <div className={`flex items-center gap-2${onDelete ? ' pr-12' : ''}`}>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-900 border border-green-700 rounded-lg text-green-200 font-semibold text-sm">
            <Layers className="w-4 h-4 text-green-400 mr-1" />
            Total In Material:
            <span className="ml-1 font-bold">{totalInMaterial.toLocaleString()}</span>
          </span>
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg transition-all z-40"
            title="Hapus Child Part"
          >
            <X className="w-5 h-5" />
          </button>
        )}
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
                {Array.from({ length: days }, (_, i) => (
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
                {Array.from({ length: days }, (_, i) => [
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
                <td className="p-2 bg-slate-800 text-slate-200 font-semibold sticky left-0 z-20 border-r border-slate-700" style={{ background: '#1e293b', minWidth: 140 }}>IN MATERIAL</td>
                {inMaterial.map((val, dayIdx) => [
                  <td key={`inmat-1-${dayIdx}`} className="p-2">
                    <input
                      type="number"
                      min={0}
                      value={val[0] ?? ""}
                      onChange={e => handleInMaterialChange(dayIdx, 0, e.target.value)}
                      className="w-16 px-2 py-1 rounded bg-slate-700 border border-slate-600 text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </td>,
                  <td key={`inmat-2-${dayIdx}`} className="p-2">
                    <input
                      type="number"
                      min={0}
                      value={val[1] ?? ""}
                      onChange={e => handleInMaterialChange(dayIdx, 1, e.target.value)}
                      className="w-16 px-2 py-1 rounded bg-slate-700 border border-slate-600 text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </td>,
                ])}
              </tr>
              {/* Teori Stock */}
              <tr>
                <td className="p-2 bg-slate-800 text-slate-200 font-semibold sticky left-0 z-20 border-r border-slate-700" style={{ background: '#1e293b', minWidth: 140 }}>TEORI STOCK (PCS)</td>
                {Array.from({ length: days }, (_, dayIdx) => [
                  <td key={`teori-1-${dayIdx}`} className="p-2 text-blue-300 font-mono">{teoriStock[dayIdx * 2]}</td>,
                  <td key={`teori-2-${dayIdx}`} className="p-2 text-blue-300 font-mono">{teoriStock[dayIdx * 2 + 1]}</td>,
                ])}
              </tr>
              {/* Rencana Stock */}
              <tr>
                <td className="p-2 bg-slate-800 text-slate-200 font-semibold sticky left-0 z-20 border-r border-slate-700" style={{ background: '#1e293b', minWidth: 140 }}>RENCANA STOCK (PCS)</td>
                {Array.from({ length: days }, (_, dayIdx) => [
                  <td key={`rencana-1-${dayIdx}`} className="p-2 text-green-300 font-mono">{rencanaStock[dayIdx * 2]}</td>,
                  <td key={`rencana-2-${dayIdx}`} className="p-2 text-green-300 font-mono">{rencanaStock[dayIdx * 2 + 1]}</td>,
                ])}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChildPartTable; 