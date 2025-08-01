// Utils untuk mengelola warna dan pengelompokan baris pada ScheduleTableView

export interface RowColorConfig {
  rowBgColor: string;
  textColor: string;
}

export interface TotalColorConfig {
  bgColor: string;
  textColor: string;
}

// Definisi semua baris dengan kategori dan label yang diformat
export const ALL_ROWS = [
  {
    key: "manpower",
    label: "MANPOWER",
    category: "manpower", // Kategori khusus untuk manpower
  },
  {
    key: "delivery",
    label: "DELIVERY PLAN (PCS)",
    category: "delivery",
  },
  {
    key: "akumulasi-delivery",
    label: "AKUMULASI\nDELIVERY (PCS)",
    category: "delivery",
  },
  {
    key: "planning-pcs",
    label: "PLANNING PRODUKSI (PCS)",
    category: "planning",
  },
  {
    key: "planning-jam",
    label: "PLANNING PRODUKSI (JAM)",
    category: "planning",
  },
  {
    key: "overtime-pcs",
    label: "OVERTIME (PCS)",
    category: "overtime",
  },
  {
    key: "overtime-jam",
    label: "OVERTIME (JAM)",
    category: "overtime",
  },
  {
    key: "jam-produksi",
    label: "JAM PRODUKSI\n(CYCLETIME)",
    category: "hasil-produksi-1", // Grup 1 hasil produksi
  },
  {
    key: "hasil-produksi",
    label: "HASIL PRODUKSI\nAKTUAL (PCS)",
    category: "hasil-produksi-1", // Grup 1 hasil produksi
  },
  {
    key: "akumulasi-hasil",
    label: "AKUMULASI HASIL\nPRODUKSI AKTUAL (PCS)",
    category: "hasil-produksi-2", // Grup 2 hasil produksi
  },
  {
    key: "jam-aktual",
    label: "JAM PRODUKSI\nAKTUAL",
    category: "hasil-produksi-2", // Grup 2 hasil produksi
  },
  {
    key: "actual-stock",
    label: "ACTUAL STOCK\n(PCS)",
    category: "stock",
  },
  {
    key: "rencana-stock",
    label: "RENCANA STOCK\n(PCS)",
    category: "stock",
  },
];

// Fungsi untuk mendapatkan warna baris berdasarkan kategori (Light Theme)
export const getRowColorByCategory = (
  category: string,
  isDark: boolean = false,
): RowColorConfig => {
  if (isDark) {
    // Dark theme colors
    switch (category) {
      case "manpower":
        return {
          rowBgColor: "bg-slate-700",
          textColor: "text-slate-200",
        };
      case "stock":
        return {
          rowBgColor: "bg-blue-900/30",
          textColor: "text-blue-200",
        };
      case "delivery":
        return {
          rowBgColor: "bg-blue-900/30",
          textColor: "text-blue-200",
        };
      case "planning":
        return {
          rowBgColor: "bg-amber-900/30",
          textColor: "text-amber-200",
        };
      case "overtime":
        return {
          rowBgColor: "bg-rose-900/30",
          textColor: "text-rose-200",
        };
      case "hasil-produksi-1":
        return {
          rowBgColor: "bg-emerald-900/30",
          textColor: "text-emerald-200",
        };
      case "hasil-produksi-2":
        return {
          rowBgColor: "bg-violet-900/30",
          textColor: "text-violet-200",
        };
      default:
        return {
          rowBgColor: "bg-slate-700",
          textColor: "text-slate-200",
        };
    }
  } else {
    // Light theme colors
    switch (category) {
      case "manpower":
        return {
          rowBgColor: "bg-slate-200",
          textColor: "text-slate-800",
        };
      case "stock":
        return {
          rowBgColor: "bg-blue-100",
          textColor: "text-blue-900",
        };
      case "delivery":
        return {
          rowBgColor: "bg-blue-100",
          textColor: "text-blue-900",
        };
      case "planning":
        return {
          rowBgColor: "bg-amber-100",
          textColor: "text-amber-900",
        };
      case "overtime":
        return {
          rowBgColor: "bg-rose-100",
          textColor: "text-rose-900",
        };
      case "hasil-produksi-1":
        return {
          rowBgColor: "bg-emerald-100",
          textColor: "text-emerald-900",
        };
      case "hasil-produksi-2":
        return {
          rowBgColor: "bg-violet-100",
          textColor: "text-violet-900",
        };
      default:
        return {
          rowBgColor: "bg-gray-100",
          textColor: "text-gray-800",
        };
    }
  }
};

// Fungsi untuk mendapatkan warna total berdasarkan kategori (Light Theme)
export const getTotalColorByCategory = (
  category: string,
  isDark: boolean = false,
): TotalColorConfig => {
  if (isDark) {
    // Dark theme colors
    switch (category) {
      case "manpower":
        return {
          bgColor: "bg-slate-600",
          textColor: "text-slate-200",
        };
      case "stock":
        return {
          bgColor: "bg-blue-800/50",
          textColor: "text-blue-200",
        };
      case "delivery":
        return {
          bgColor: "bg-blue-800/50",
          textColor: "text-blue-200",
        };
      case "planning":
        return {
          bgColor: "bg-amber-800/50",
          textColor: "text-amber-200",
        };
      case "overtime":
        return {
          bgColor: "bg-rose-800/50",
          textColor: "text-rose-200",
        };
      case "hasil-produksi-1":
        return {
          bgColor: "bg-emerald-800/50",
          textColor: "text-emerald-200",
        };
      case "hasil-produksi-2":
        return {
          bgColor: "bg-violet-800/50",
          textColor: "text-violet-200",
        };
      default:
        return {
          bgColor: "bg-slate-600",
          textColor: "text-slate-200",
        };
    }
  } else {
    // Light theme colors
    switch (category) {
      case "manpower":
        return {
          bgColor: "bg-slate-300",
          textColor: "text-slate-800",
        };
      case "stock":
        return {
          bgColor: "bg-blue-200",
          textColor: "text-blue-900",
        };
      case "delivery":
        return {
          bgColor: "bg-blue-200",
          textColor: "text-blue-900",
        };
      case "planning":
        return {
          bgColor: "bg-amber-200",
          textColor: "text-amber-900",
        };
      case "overtime":
        return {
          bgColor: "bg-rose-200",
          textColor: "text-rose-900",
        };
      case "hasil-produksi-1":
        return {
          bgColor: "bg-emerald-200",
          textColor: "text-emerald-900",
        };
      case "hasil-produksi-2":
        return {
          bgColor: "bg-violet-200",
          textColor: "text-violet-900",
        };
      default:
        return {
          bgColor: "bg-gray-200",
          textColor: "text-gray-900",
        };
    }
  }
};

// Fungsi untuk mendapatkan konfigurasi warna baris dengan override khusus
export const getRowColorConfig = (
  rowKey: string,
  isDark: boolean = false,
): RowColorConfig => {
  // Override khusus untuk baris tertentu
  if (rowKey === "actual-stock") {
    if (isDark) {
      return {
        rowBgColor: "bg-sky-900/30",
        textColor: "text-sky-200",
      };
    } else {
      return {
        rowBgColor: "bg-sky-100",
        textColor: "text-sky-900",
      };
    }
  }

  // Gunakan kategori dari ALL_ROWS
  const rowConfig = ALL_ROWS.find((row) => row.key === rowKey);
  if (rowConfig) {
    return getRowColorByCategory(rowConfig.category, isDark);
  }

  return {
    rowBgColor: isDark ? "bg-slate-700" : "bg-gray-100",
    textColor: isDark ? "text-slate-200" : "text-gray-800",
  };
};

// Fungsi untuk mendapatkan konfigurasi warna total dengan override khusus
export const getTotalColorConfig = (
  rowKey: string,
  isDark: boolean = false,
): TotalColorConfig => {
  // Override khusus untuk baris tertentu
  if (rowKey === "actual-stock") {
    if (isDark) {
      return {
        bgColor: "bg-sky-800/50",
        textColor: "text-sky-200",
      };
    } else {
      return {
        bgColor: "bg-sky-200",
        textColor: "text-sky-900",
      };
    }
  }

  // Gunakan kategori dari ALL_ROWS
  const rowConfig = ALL_ROWS.find((row) => row.key === rowKey);
  if (rowConfig) {
    return getTotalColorByCategory(rowConfig.category, isDark);
  }

  return {
    bgColor: isDark ? "bg-slate-600" : "bg-gray-200",
    textColor: isDark ? "text-slate-200" : "text-gray-900",
  };
};

// Filter options untuk menu filter
export const FILTER_OPTIONS = [
  { value: "all", label: "Semua Data" },
  { value: "delivery", label: "Delivery" },
  { value: "planning", label: "Planning" },
  { value: "overtime", label: "Overtime" },
  { value: "hasil-produksi", label: "Hasil Produksi" },
];

// Fungsi untuk memfilter baris berdasarkan filter aktif
export const getFilteredRows = (activeFilter: string) => {
  if (activeFilter === "all") return ALL_ROWS;
  if (activeFilter === "hasil-produksi") {
    return ALL_ROWS.filter(
      (row) =>
        row.category === "hasil-produksi-1" ||
        row.category === "hasil-produksi-2",
    );
  }
  return ALL_ROWS.filter((row) => row.category === activeFilter);
};
