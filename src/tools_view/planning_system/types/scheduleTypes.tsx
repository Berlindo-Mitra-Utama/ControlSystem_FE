export interface ScheduleItem {
  id: string;
  day: number;
  shift: string;
  type: string;
  pcs: number;
  time: string;
  processes?: string;
  status: "Normal" | "Gangguan" | "Completed";
  actualPcs?: number;
  notes?: string;
  delivery?: number;
  planningPcs?: number;
  overtimePcs?: number;
  sisaPlanningPcs?: number;
  sisaStock?: number;
  selisih?: number;
  planningHour?: number;
  overtimeHour?: number;
  jamProduksiAktual?: number;
  akumulasiDelivery?: number;
  hasilProduksi?: number;
  akumulasiHasilProduksi?: number;
  jamProduksiCycleTime?: number;
  selisihDetikPerPcs?: number;
  selisihCycleTime?: number;
  selisihCycleTimePcs?: number;
  actualStock?: number;
  // Tambahan untuk custom stock
  actualStockCustom?: number;
  rencanaStockCustom?: number;
  manpower?: number;
  manpowerIds?: number[];
  // Backend integration
  backendId?: number;
}

export interface ScheduleTableProps {
  schedule: ScheduleItem[];
  editingRow: string | null;
  editForm: Partial<ScheduleItem>;
  startEdit: (item: ScheduleItem) => void;
  saveEdit: (itemId: string) => void;
  cancelEdit: () => void;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<ScheduleItem>>>;
  initialStock: number;
  timePerPcs?: number;
  scheduleName?: string;
  viewMode?: "cards" | "table";
  searchDate?: string;
  onDataChange?: (updatedRows: ScheduleItem[]) => void;
  manpowerList?: any[];
  // Tambahkan props untuk informasi produk
  productInfo?: {
    partName?: string;
    customer?: string;
    partImageUrl?: string;
    lastSavedBy?: {
      nama: string;
      role: string;
    };
    lastSavedAt?: string;
  };
}
