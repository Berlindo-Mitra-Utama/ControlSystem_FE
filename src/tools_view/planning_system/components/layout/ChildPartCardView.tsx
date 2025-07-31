import React, { useState, useCallback, memo, useEffect } from "react";
import { Package, User, Layers, X, TrendingUp, TrendingDown, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";

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
  onEdit?: () => void;
  inMaterial?: (number|null)[][];
  onInMaterialChange?: (val: (number|null)[][]) => void;
  aktualInMaterial?: (number|null)[][];
  onAktualInMaterialChange?: (val: (number|null)[][]) => void;
  renderHeaderAction?: React.ReactNode;
  activeFilter?: string[];
  onDateSelect?: (date: Date | null) => void;
  selectedDate?: Date | null;
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
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700 max-w-sm w-full">
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex gap-4 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600">Batal</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Hapus</button>
        </div>
      </div>
    </div>
  );
};

const ChildPartCardView: React.FC<ChildPartCardViewProps> = (props) => {
  // In Material per shift per hari: [ [shift1, shift2], ... ]
  const [inMaterialState, setInMaterialState] = useState<(number|null)[][]>(
    props.inMaterial ?? Array.from({ length: props.days }, () => [null, null])
  );
  const [currentDay, setCurrentDay] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Set default date to 1st of current month if no date is selected
  const getDefaultDate = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  };
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    props.selectedDate || getDefaultDate()
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

  // Get the day index from selected date
  const getDayIndexFromDate = (date: Date | null) => {
    if (!date) return 0;
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(diffDays, props.days - 1));
  };

  // Navigation functions for carousel - now based on selected date
  const goToNextDay = () => {
    setLoading(true);
    setTimeout(() => {
      if (selectedDate) {
        const nextDate = new Date(selectedDate);
        nextDate.setDate(nextDate.getDate() + 1);
        setSelectedDate(nextDate);
      } else {
        setCurrentDay(prev => Math.min(prev + 1, props.days - 1));
      }
      setLoading(false);
    }, 500);
  };

  const goToPrevDay = () => {
    setLoading(true);
    setTimeout(() => {
      if (selectedDate) {
        const prevDate = new Date(selectedDate);
        prevDate.setDate(prevDate.getDate() - 1);
        setSelectedDate(prevDate);
      } else {
        setCurrentDay(prev => Math.max(prev - 1, 0));
      }
      setLoading(false);
    }, 500);
  };

  // Get current display day
  const getCurrentDisplayDay = () => {
    if (selectedDate) {
      return getDayIndexFromDate(selectedDate);
    }
    return currentDay;
  };

  // Calendar functions
  const handleCalendarClick = () => {
    setShowCalendar(!showCalendar);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSaveDate = () => {
    if (props.onDateSelect) {
      props.onDateSelect(selectedDate);
    }
    setShowCalendar(false);
  };

  const handleClearDate = () => {
    setSelectedDate(getDefaultDate()); // Reset to default date instead of null
    if (props.onDateSelect) {
      props.onDateSelect(getDefaultDate());
    }
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }
    
    return days;
  };

  // Format date for display
  const formatSelectedDate = (date: Date | null) => {
    if (!date) return "Semua Hari";
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Render baris sesuai filter
  const renderFilteredContent = () => {
    const displayDay = getCurrentDisplayDay();
    
    // Jika tidak ada filter aktif, tampilkan semua konten
    if (!props.activeFilter || props.activeFilter.length === 0) {
      return (
        <>
          {/* Carousel Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goToPrevDay}
              disabled={selectedDate ? selectedDate.getDate() <= 1 : displayDay === 0}
              className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-all disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <div className="text-lg font-medium text-gray-300">
                {selectedDate ? formatSelectedDate(selectedDate) : `${getDayName(displayDay)}, ${displayDay + 1} ${new Date().toLocaleDateString('id-ID', { month: 'long' })} ${new Date().getFullYear()}`}
              </div>
            </div>
            
            <button
              onClick={goToNextDay}
              disabled={selectedDate ? selectedDate.getDate() >= 31 : displayDay === props.days - 1}
              className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-all disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* In Material */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              Rencana In Material
            </h3>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Shift 1</label>
                  <InputCell
                    key={`rencana-shift1-day${displayDay}`}
                    value={inMaterial[displayDay][0]}
                    onChange={v => handleInMaterialChange(displayDay, 0, v)}
                    className="w-full px-4 py-3 rounded bg-slate-700 border border-slate-600 text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Shift 2</label>
                  <InputCell
                    key={`rencana-shift2-day${displayDay}`}
                    value={inMaterial[displayDay][1]}
                    onChange={v => handleInMaterialChange(displayDay, 1, v)}
                    className="w-full px-4 py-3 rounded bg-slate-700 border border-slate-600 text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Aktual In Material */}
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-green-400" />
              Aktual In Material
            </h3>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Shift 1</label>
                  <InputCell
                    key={`aktual-shift1-day${displayDay}`}
                    value={aktualInMaterial[displayDay][0]}
                    onChange={v => handleAktualInMaterialChange(displayDay, 0, v)}
                    className="w-full px-4 py-3 rounded bg-green-700 border border-green-600 text-white text-center focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Shift 2</label>
                  <InputCell
                    key={`aktual-shift2-day${displayDay}`}
                    value={aktualInMaterial[displayDay][1]}
                    onChange={v => handleAktualInMaterialChange(displayDay, 1, v)}
                    className="w-full px-4 py-3 rounded bg-green-700 border border-green-600 text-white text-center focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rencana Stock */}
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Rencana Stock (PCS)
            </h3>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Shift 1</label>
                  <div className="w-full px-4 py-3 rounded bg-slate-700 border border-slate-600 text-white text-center text-base">
                    {rencanaStock[displayDay * 2]?.toFixed(0) || "0"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Shift 2</label>
                  <div className="w-full px-4 py-3 rounded bg-slate-700 border border-slate-600 text-white text-center text-base">
                    {rencanaStock[displayDay * 2 + 1]?.toFixed(0) || "0"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Aktual Stock */}
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              Aktual Stock (PCS)
            </h3>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Shift 1</label>
                  <div className="w-full px-4 py-3 rounded bg-slate-700 border border-slate-600 text-white text-center text-base">
                    {aktualStock[displayDay * 2]?.toFixed(0) || "0"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Shift 2</label>
                  <div className="w-full px-4 py-3 rounded bg-slate-700 border border-slate-600 text-white text-center text-base">
                    {aktualStock[displayDay * 2 + 1]?.toFixed(0) || "0"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }

    // Jika ada filter aktif, tampilkan konten sesuai filter yang dipilih
    return (
      <>
        {/* Carousel Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPrevDay}
            disabled={selectedDate ? selectedDate.getDate() <= 1 : displayDay === 0}
            className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-all disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="text-lg font-medium text-gray-300">
              {selectedDate ? formatSelectedDate(selectedDate) : `${getDayName(displayDay)}, ${displayDay + 1} ${new Date().toLocaleDateString('id-ID', { month: 'long' })} ${new Date().getFullYear()}`}
            </div>
          </div>
          
          <button
            onClick={goToNextDay}
            disabled={selectedDate ? selectedDate.getDate() >= 31 : displayDay === props.days - 1}
            className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-all disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Render konten sesuai filter yang dipilih */}
        {props.activeFilter.includes("rencanaInMaterial") && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              Rencana In Material
            </h3>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Shift 1</label>
                  <InputCell
                    key={`rencana-shift1-day${displayDay}`}
                    value={inMaterial[displayDay][0]}
                    onChange={v => handleInMaterialChange(displayDay, 0, v)}
                    className="w-full px-4 py-3 rounded bg-slate-700 border border-slate-600 text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Shift 2</label>
                  <InputCell
                    key={`rencana-shift2-day${displayDay}`}
                    value={inMaterial[displayDay][1]}
                    onChange={v => handleInMaterialChange(displayDay, 1, v)}
                    className="w-full px-4 py-3 rounded bg-slate-700 border border-slate-600 text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {props.activeFilter.includes("aktualInMaterial") && (
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-green-400" />
              Aktual In Material
            </h3>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Shift 1</label>
                  <InputCell
                    key={`aktual-shift1-day${displayDay}`}
                    value={aktualInMaterial[displayDay][0]}
                    onChange={v => handleAktualInMaterialChange(displayDay, 0, v)}
                    className="w-full px-4 py-3 rounded bg-green-700 border border-green-600 text-white text-center focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Shift 2</label>
                  <InputCell
                    key={`aktual-shift2-day${displayDay}`}
                    value={aktualInMaterial[displayDay][1]}
                    onChange={v => handleAktualInMaterialChange(displayDay, 1, v)}
                    className="w-full px-4 py-3 rounded bg-green-700 border border-green-600 text-white text-center focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {props.activeFilter.includes("rencanaStock") && (
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Rencana Stock (PCS)
            </h3>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Shift 1</label>
                  <div className="w-full px-4 py-3 rounded bg-slate-700 border border-slate-600 text-white text-center text-base">
                    {rencanaStock[displayDay * 2]?.toFixed(0) || "0"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Shift 2</label>
                  <div className="w-full px-4 py-3 rounded bg-slate-700 border border-slate-600 text-white text-center text-base">
                    {rencanaStock[displayDay * 2 + 1]?.toFixed(0) || "0"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {props.activeFilter.includes("aktualStock") && (
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              Aktual Stock (PCS)
            </h3>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Shift 1</label>
                  <div className="w-full px-4 py-3 rounded bg-slate-700 border border-slate-600 text-white text-center text-base">
                    {aktualStock[displayDay * 2]?.toFixed(0) || "0"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Shift 2</label>
                  <div className="w-full px-4 py-3 rounded bg-slate-700 border border-slate-600 text-white text-center text-base">
                    {aktualStock[displayDay * 2 + 1]?.toFixed(0) || "0"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDeleteClick = () => setShowDeleteModal(true);
  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    if (props.onDelete) props.onDelete();
  };

  // Input reset effect
  useEffect(() => {
    const displayDay = getCurrentDisplayDay();
    
    // Ensure inMaterialState is properly initialized for the current day
    setInMaterialState(prev => {
      const next = [...prev];
      // If the current day doesn't exist in the array, initialize it
      if (!next[displayDay]) {
        next[displayDay] = [null, null];
      }
      return next;
    });
    
    // Ensure aktualInMaterial is properly initialized for the current day
    if (props.onAktualInMaterialChange && props.aktualInMaterial) {
      const currentAktualInMaterial = [...props.aktualInMaterial];
      // If the current day doesn't exist in the array, initialize it
      if (!currentAktualInMaterial[displayDay]) {
        currentAktualInMaterial[displayDay] = [null, null];
        props.onAktualInMaterialChange(currentAktualInMaterial);
      }
    }
  }, [selectedDate, currentDay]); // Depend on the actual values that change when navigating

  return (
    <div className="mt-6">
      {/* Header Info */}
      <div className="p-4 pb-2 bg-slate-900 rounded-t-xl border border-b-0 border-slate-700 relative">
        {/* Main Header Content */}
        <div className="flex flex-col gap-4">
          {/* Top Row: Title and Action Buttons */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="text-white font-bold text-lg">
                {props.partName}
              </span>
            </div>
            
            {/* Action Buttons - Sticky to top-right */}
            <div className="flex gap-2 items-center flex-shrink-0">
              {props.renderHeaderAction && (
                <div className="flex gap-2 items-center">
                  {props.renderHeaderAction}
                </div>
              )}
              {/* Calendar Button */}
              <button
                onClick={handleCalendarClick}
                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                title="Pilih Tanggal"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Customer Info - Sticky position */}
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 font-semibold text-sm">
              <User className="w-4 h-4 text-emerald-400 mr-1" />
              {props.customerName}
            </span>
          </div>

          {/* Material Info Panels - Sticky positions */}
          <div className="flex flex-col gap-2 flex-shrink-0">
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
      </div>
      
      {/* Card Content */}
      <div className="bg-slate-900 rounded-b-xl border border-t-0 border-slate-700">
        <div className="p-4 pt-2">
          {renderFilteredContent()}
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-80 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Pilih Tanggal Produksi</h3>
              <button
                onClick={() => setShowCalendar(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((day, idx) => (
                <div key={idx} className="text-center text-xs text-slate-400 font-medium p-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((date, idx) => (
                <button
                  key={idx}
                  onClick={() => date && handleDateSelect(date)}
                  disabled={!date}
                  className={`p-2 text-sm rounded transition-all ${
                    !date 
                      ? 'invisible' 
                      : selectedDate && selectedDate.toDateString() === date.toDateString()
                        ? 'bg-blue-500 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {date ? date.getDate() : ''}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveDate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
              >
                Simpan
              </button>
              <button
                onClick={() => setShowCalendar(false)}
                className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
      {loading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteConfirm} title="Konfirmasi Hapus" message="Apakah Anda yakin ingin menghapus data ini?" />
    </div>
  );
};

export default memo(ChildPartCardView); 