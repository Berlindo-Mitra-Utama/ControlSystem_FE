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
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  // Hapus modal konfirmasi lokal untuk delete part (gunakan modal global dari parent)
  const [showDeleteScheduleModal, setShowDeleteScheduleModal] = useState(false);
  const [showEditPartModal, setShowEditPartModal] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // Collect all disruptions for navigation
  const getAllDisruptions = () => {
    const disruptions: Array<{
      partId: string;
      partName: string;
      customerName: string;
      day: number;
      shift: number;
      type: 'rencanaInMaterial' | 'aktualInMaterial' | 'rencanaStock' | 'aktualStock';
      value: number;
      fieldName: string;
    }> = [];

    for (let dayIdx = 0; dayIdx < props.days; dayIdx++) {
      // Check inMaterial errors
      if (showRencanaInMaterial) {
        if (hasValueError(inMaterial[dayIdx][0])) {
          disruptions.push({
            partId: props.partName, // Using partName as ID for now
            partName: props.partName,
            customerName: props.customerName,
            day: dayIdx + 1,
            shift: 1,
            type: 'rencanaInMaterial',
            value: inMaterial[dayIdx][0]!,
            fieldName: 'Rencana In Material Shift 1'
          });
        }
        if (hasValueError(inMaterial[dayIdx][1])) {
          disruptions.push({
            partId: props.partName,
            partName: props.partName,
            customerName: props.customerName,
            day: dayIdx + 1,
            shift: 2,
            type: 'rencanaInMaterial',
            value: inMaterial[dayIdx][1]!,
            fieldName: 'Rencana In Material Shift 2'
          });
        }
      }

      // Check aktualInMaterial errors
      if (showAktualInMaterial) {
        if (hasValueError(aktualInMaterial[dayIdx][0])) {
          disruptions.push({
            partId: props.partName,
            partName: props.partName,
            customerName: props.customerName,
            day: dayIdx + 1,
            shift: 1,
            type: 'aktualInMaterial',
            value: aktualInMaterial[dayIdx][0]!,
            fieldName: 'Aktual In Material Shift 1'
          });
        }
        if (hasValueError(aktualInMaterial[dayIdx][1])) {
          disruptions.push({
            partId: props.partName,
            partName: props.partName,
            customerName: props.customerName,
            day: dayIdx + 1,
            shift: 2,
            type: 'aktualInMaterial',
            value: aktualInMaterial[dayIdx][1]!,
            fieldName: 'Aktual In Material Shift 2'
          });
        }
      }

      // Check stock errors
      if (showRencanaStock) {
        if (hasStockError(rencanaStock[dayIdx * 2])) {
          disruptions.push({
            partId: props.partName,
            partName: props.partName,
            customerName: props.customerName,
            day: dayIdx + 1,
            shift: 1,
            type: 'rencanaStock',
            value: rencanaStock[dayIdx * 2],
            fieldName: 'Rencana Stock Shift 1'
          });
        }
        if (hasStockError(rencanaStock[dayIdx * 2 + 1])) {
          disruptions.push({
            partId: props.partName,
            partName: props.partName,
            customerName: props.customerName,
            day: dayIdx + 1,
            shift: 2,
            type: 'rencanaStock',
            value: rencanaStock[dayIdx * 2 + 1],
            fieldName: 'Rencana Stock Shift 2'
          });
        }
      }

      if (showAktualStock) {
        if (hasStockError(aktualStock[dayIdx * 2])) {
          disruptions.push({
            partId: props.partName,
            partName: props.partName,
            customerName: props.customerName,
            day: dayIdx + 1,
            shift: 1,
            type: 'aktualStock',
            value: aktualStock[dayIdx * 2],
            fieldName: 'Aktual Stock Shift 1'
          });
        }
        if (hasStockError(aktualStock[dayIdx * 2 + 1])) {
          disruptions.push({
            partId: props.partName,
            partName: props.partName,
            customerName: props.customerName,
            day: dayIdx + 1,
            shift: 2,
            type: 'aktualStock',
            value: aktualStock[dayIdx * 2 + 1],
            fieldName: 'Aktual Stock Shift 2'
          });
        }
      }
    }

    return disruptions;
  };

  // Handle navigation to disruption page
  const handleNavigateToDisruption = () => {
    const disruptions = getAllDisruptions();
    // Store disruptions in sessionStorage for the disruption page to access
    sessionStorage.setItem('disruptions', JSON.stringify(disruptions));
    sessionStorage.setItem('currentPartInfo', JSON.stringify({
      partName: props.partName,
      customerName: props.customerName,
      days: props.days
    }));
    navigate('/dashboard/disruption');
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

  // Check for navigation targets from disruption page
  useEffect(() => {
    const navigateToField = sessionStorage.getItem('navigateToField');
    console.log('🔍 ChildPartTable: navigateToField dari sessionStorage:', navigateToField);
    if (navigateToField) {
      try {
        const target = JSON.parse(navigateToField);
        console.log('🔍 ChildPartTable: Target parsed:', target);
        console.log('🔍 ChildPartTable: props.partName:', props.partName);
        
        // Check if this is a navigation to specific field (either from disruption page or "back to planning")
        console.log('🔍 ChildPartTable: Checking navigation conditions...');
        console.log('🔍 ChildPartTable: target.partName === props.partName:', target.partName === props.partName);
        console.log('🔍 ChildPartTable: target.navigateToSpecificField:', target.navigateToSpecificField);
        console.log('🔍 ChildPartTable: target.day:', target.day);
        console.log('🔍 ChildPartTable: target.shift:', target.shift);
        console.log('🔍 ChildPartTable: target.type:', target.type);
        
        if (target.partName === props.partName && (target.navigateToSpecificField || target.day)) {
          // Clear the navigation target
          sessionStorage.removeItem('navigateToField');
          
          // Wait for DOM to be ready
          setTimeout(() => {
            // Find the specific field element based on type, day, and shift
            let fieldElement: HTMLElement | null = null;
            
            if (target.type === 'rencanaInMaterial' || target.type === 'aktualInMaterial') {
              // For input fields, find the specific input element
              const dayElement = document.querySelector(`[data-day="${target.day}"]`);
              console.log('🔍 ChildPartTable: Mencari day element dengan data-day="${target.day}":', dayElement);
              if (dayElement) {
                const shiftIndex = target.shift - 1; // Convert shift 1/2 to 0/1
                const inputElements = dayElement.querySelectorAll('input[type="number"]');
                console.log('🔍 ChildPartTable: Input elements found:', inputElements.length, 'for shift index:', shiftIndex);
                if (inputElements[shiftIndex]) {
                  fieldElement = inputElements[shiftIndex] as HTMLElement;
                  console.log('✅ ChildPartTable: Input field element found for shift', target.shift);
                } else {
                  console.log('⚠️ ChildPartTable: Input field element not found for shift index:', shiftIndex);
                }
              } else {
                console.log('⚠️ ChildPartTable: Day element not found for day:', target.day);
              }
            } else if (target.type === 'rencanaStock' || target.type === 'aktualStock') {
              // For stock fields, find the specific stock display
              const dayElement = document.querySelector(`[data-day="${target.day}"]`);
              console.log('🔍 ChildPartTable: Mencari day element untuk stock dengan data-day="${target.day}":', dayElement);
              if (dayElement) {
                const shiftIndex = target.shift - 1; // Convert shift 1/2 to 0/1
                const stockElements = dayElement.querySelectorAll('[data-stock-type]');
                console.log('🔍 ChildPartTable: Stock elements found:', stockElements.length);
                const targetElement = Array.from(stockElements).find(el => 
                  el.getAttribute('data-stock-type') === target.type &&
                  el.getAttribute('data-shift') === target.shift.toString()
                );
                if (targetElement) {
                  fieldElement = targetElement as HTMLElement;
                  console.log('✅ ChildPartTable: Stock field element found for type:', target.type, 'shift:', target.shift);
                } else {
                  console.log('⚠️ ChildPartTable: Stock field element not found for type:', target.type, 'shift:', target.shift);
                  console.log('🔍 Available stock elements:', Array.from(stockElements).map(el => ({
                    type: el.getAttribute('data-stock-type'),
                    shift: el.getAttribute('data-shift')
                  })));
                }
              } else {
                console.log('⚠️ ChildPartTable: Day element not found for day:', target.day);
              }
            }
            
            if (fieldElement) {
              console.log('🎯 ChildPartTable: Field element ditemukan:', fieldElement);
              console.log('🎯 ChildPartTable: Field type:', fieldElement.tagName);
              console.log('🎯 ChildPartTable: Field classes:', fieldElement.className);
              
              // Enhanced horizontal scrolling for ChildPartTable with visual scroll bar animation
              const scrollableContainer = fieldElement.closest('.overflow-x-auto') || 
                                       fieldElement.closest('[class*="overflow-x"]') ||
                                       document.querySelector('.overflow-x-auto');
               
               if (scrollableContainer) {
                console.log('🔍 ChildPartTable enhanced scrollable container found:', scrollableContainer);
                console.log('🔍 ChildPartTable container classes:', scrollableContainer.className);
                console.log('🔍 ChildPartTable container scroll info:', {
                  scrollWidth: scrollableContainer.scrollWidth,
                  clientWidth: scrollableContainer.clientWidth,
                  scrollLeft: scrollableContainer.scrollLeft,
                  maxScrollLeft: scrollableContainer.scrollWidth - scrollableContainer.clientWidth
                });
                console.log('🔍 Container scroll info:', {
                  scrollWidth: scrollableContainer.scrollWidth,
                  clientWidth: scrollableContainer.clientWidth,
                  scrollLeft: scrollableContainer.scrollLeft,
                  maxScrollLeft: scrollableContainer.scrollWidth - scrollableContainer.clientWidth
                });
                
                // Calculate scroll position to center the field
                const containerRect = scrollableContainer.getBoundingClientRect();
                const fieldRect = fieldElement.getBoundingClientRect();
                const currentScrollLeft = scrollableContainer.scrollLeft;
                
                // Calculate target scroll position to center the field
                const fieldCenter = fieldRect.left + (fieldRect.width / 2);
                const containerCenter = containerRect.left + (containerRect.width / 2);
                const scrollOffset = fieldCenter - containerCenter;
                const targetScrollLeft = currentScrollLeft + scrollOffset;
                
                // Ensure we don't scroll beyond bounds
                const maxScrollLeft = scrollableContainer.scrollWidth - scrollableContainer.clientWidth;
                const finalTargetScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScrollLeft));
                
                console.log('🔍 ChildPartTable enhanced scroll calculation:', {
                  containerWidth: containerRect.width,
                  fieldWidth: fieldRect.width,
                  fieldLeft: fieldRect.left,
                  containerLeft: containerRect.left,
                  currentScrollLeft,
                  targetScrollLeft,
                  finalTargetScrollLeft,
                  scrollOffset,
                  maxScrollLeft
                });
                
                // Enhanced smooth scroll with step-by-step animation for ChildPartTable
                const startScrollLeft = currentScrollLeft;
                const distance = finalTargetScrollLeft - startScrollLeft;
                const duration = 1000; // 1 second for ChildPartTable
                const startTime = performance.now();
                
                // Add visual indicator for ChildPartTable scroll progress
                const scrollProgressIndicator = document.createElement('div');
                scrollProgressIndicator.className = 'fixed top-20 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg';
                scrollProgressIndicator.innerHTML = `
                  <div class="flex items-center gap-2">
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Navigasi ke field ${target.fieldName}...</span>
                  </div>
                  <div class="w-full bg-white bg-opacity-30 rounded-full h-2 mt-2">
                    <div class="bg-white h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                  </div>
                `;
                document.body.appendChild(scrollProgressIndicator);
                
                const progressBar = scrollProgressIndicator.querySelector('.bg-white.h-2') as HTMLElement;
                
                // Animate scroll step by step for ChildPartTable
                const animateScroll = (currentTime: number) => {
                  const elapsed = currentTime - startTime;
                  const progress = Math.min(elapsed / duration, 1);
                  
                  // Easing function for smooth animation
                  const easeInOutCubic = (t: number) => {
                    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                  };
                  
                  const easedProgress = easeInOutCubic(progress);
                  const currentScrollLeft = startScrollLeft + (distance * easedProgress);
                  
                  // Update scroll position directly
                  scrollableContainer.scrollLeft = currentScrollLeft;
                  
                  // Update progress bar
                  if (progressBar) {
                    progressBar.style.width = `${progress * 100}%`;
                  }
                  
                  // Continue animation or complete
                  if (progress < 1) {
                    requestAnimationFrame(animateScroll);
                  } else {
                    // Animation complete
                    console.log('✅ ChildPartTable enhanced smooth scroll selesai');
                    console.log('🔍 Final scroll position:', scrollableContainer.scrollLeft);
                    
                    // Remove progress indicator
                    setTimeout(() => {
                      if (scrollProgressIndicator.parentNode) {
                        scrollProgressIndicator.parentNode.removeChild(scrollProgressIndicator);
                      }
                    }, 1000);
                    
                    // Add scroll bar highlight effect for ChildPartTable
                    if (scrollableContainer.classList.contains('custom-scrollbar')) {
                      scrollableContainer.classList.add('scroll-animation-active');
                      
                      // Remove animation class after scroll completes
                      setTimeout(() => {
                        scrollableContainer.classList.remove('scroll-animation-active');
                      }, 3000);
                    }
                  }
                };
                
                // Start animation
                requestAnimationFrame(animateScroll);
                
              } else {
                console.log('⚠️ ChildPartTable scrollable container tidak ditemukan, menggunakan scrollIntoView');
                console.log('🔍 Debug: Semua elemen dengan overflow-x-auto:', document.querySelectorAll('.overflow-x-auto'));
                console.log('🔍 Debug: Semua elemen dengan class yang mengandung overflow-x:', document.querySelectorAll('[class*="overflow-x"]'));
                
                // Fallback to scrollIntoView
                fieldElement.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center',
                  inline: 'center'
                });
              }
              
              // Add simple red border highlight - clean and simple
              fieldElement.classList.add(
                'border-2',
                'border-red-500',
                'border-solid'
              );
              
              // If it's an input field, focus on it
              if (fieldElement.tagName === 'INPUT') {
                (fieldElement as HTMLInputElement).focus();
                (fieldElement as HTMLInputElement).select();
              }
              
              // Remove highlight after 8 seconds (longer visibility)
              setTimeout(() => {
                fieldElement.classList.remove(
                  'border-2',
                  'border-red-500',
                  'border-solid'
                );
              }, 8000);
              
              // Add a simple background highlight to the entire day column
              const dayElement = document.querySelector(`[data-day="${target.day}"]`);
              if (dayElement) {
                dayElement.classList.add(
                  'bg-red-50',
                  'dark:bg-red-900/20'
                );
                setTimeout(() => {
                  dayElement.classList.remove(
                    'bg-red-50',
                    'dark:bg-red-900/20'
                  );
                }, 6000);
              }
              
              // Show success message
              console.log(`✅ Berhasil navigasi ke field "${target.fieldName}" pada ${target.day} Shift ${target.shift}`);
            } else {
              console.log('⚠️ ChildPartTable: Field element tidak ditemukan');
              console.log('🔍 Debug: Semua elemen dengan data-day:', document.querySelectorAll('[data-day]'));
              console.log('🔍 Debug: Semua elemen dengan data-stock-type:', document.querySelectorAll('[data-stock-type]'));
              console.log('🔍 Debug: Semua elemen dengan data-shift:', document.querySelectorAll('[data-shift]'));
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error parsing navigation target:', error);
        sessionStorage.removeItem('navigateToField');
      }
    }
  }, [props.partName]);

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
              onClick={handleNavigateToDisruption}
              className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 relative"
              title="View All Disruptions"
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
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <div className="flex min-w-max">
              {Array.from({ length: props.days }, (_, dayIdx) => (
                <div
                  key={dayIdx}
                  className="flex-shrink-0 w-40 border-r border-gray-300 dark:border-gray-600"
                  data-day={dayIdx + 1}
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
                        }`} data-stock-type="rencanaStock" data-shift="1">
                          {rencanaStock[dayIdx * 2]?.toFixed(0) || "0"}
                        </div>
                        <div className={`text-center flex items-center justify-center font-mono text-sm font-semibold ${
                          hasStockError(rencanaStock[dayIdx * 2 + 1]) 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-yellow-800 dark:text-yellow-200'
                        }`} data-stock-type="rencanaStock" data-shift="2">
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
                        }`} data-stock-type="aktualStock" data-shift="1">
                          {aktualStock[dayIdx * 2]?.toFixed(0) || "0"}
                        </div>
                        <div className={`text-center flex items-center justify-center font-mono text-sm font-semibold ${
                          hasStockError(aktualStock[dayIdx * 2 + 1]) 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-yellow-800 dark:text-yellow-200'
                        }`} data-stock-type="aktualStock" data-shift="2">
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
