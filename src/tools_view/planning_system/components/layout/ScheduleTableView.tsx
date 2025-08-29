import React, { useState, useEffect, useRef } from "react";
import { ScheduleItem } from "../../types/scheduleTypes";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  formatValidDate,
  parseScheduleName,
  getDayName,
} from "../../utils/scheduleDateUtils";
import {
  calculateOutputPerHour,
  calculateScheduleTotals,
  formatJamProduksi,
  formatNumber,
  calculateTotalAkumulasiDelivery,
  calculateTotalAkumulasiHasilProduksi,
  recalculateAllAkumulasi,
} from "../../utils/scheduleCalcUtils";
import {
  ALL_ROWS,
  FILTER_OPTIONS,
  getFilteredRows,
  getRowColorConfig,
  getTotalColorConfig,
} from "../../utils/scheduleColorUtils";
import { getRowDataConfig } from "../../utils/scheduleDataUtils";
import ManpowerDropdown from "./ManpowerDropdown";
import EditableCell from "./EditableCell";
import { ManpowerService } from "../../../../services/API_Services";

import {
  Clock,
  Package,
  Truck,
  Timer,
  Factory,
  TrendingUp,
  BarChart3,
  Filter,
  Target,
  Zap,
  Gauge,
  Layers,
  Activity,
  Plus,
  Trash2,
} from "lucide-react";

interface ScheduleTableViewProps {
  validGroupedRows: { day: number; rows: ScheduleItem[] }[];
  flatRows: ScheduleItem[];
  timePerPcs: number;
  initialStock: number;
  scheduleName?: string;
  setEditForm?: React.Dispatch<React.SetStateAction<Partial<ScheduleItem>>>;
  manpowerList: { id: number; name: string }[];
  setManpowerList: React.Dispatch<
    React.SetStateAction<{ id: number; name: string }[]>
  >;
  newManpower: string;
  setNewManpower: React.Dispatch<React.SetStateAction<string>>;
  handleAddManpower: () => void;
  handleRemoveManpower: (id: number) => void;
  onDataChange?: (updatedRows: ScheduleItem[]) => void;
  // Tambahkan props untuk informasi produk
  productInfo?: {
    partName?: string;
    customer?: string;
    lastSavedBy?: {
      nama: string;
      role: string;
    };
    lastSavedAt?: string;
  };
}

type FilterType = string[];

const ScheduleTableView: React.FC<ScheduleTableViewProps> = ({
  validGroupedRows,
  flatRows,
  timePerPcs,
  initialStock,
  scheduleName,
  setEditForm,
  manpowerList,
  setManpowerList,
  newManpower,
  setNewManpower,
  handleAddManpower,
  handleRemoveManpower,
  onDataChange,
  productInfo,
}) => {
  const { uiColors, theme } = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterType>([]);
  const [focusedInputs, setFocusedInputs] = useState<{
    [key: string]: boolean;
  }>({});
  // State untuk popup dan list manpower
  const [showManpowerModal, setShowManpowerModal] = useState(false);
  // State untuk notifikasi error manpower
  const [manpowerError, setManpowerError] = useState<string>("");
  // State untuk notifikasi sukses manpower
  const [manpowerSuccess, setManpowerSuccess] = useState<string>("");

  // State untuk popup filter data
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [tempActiveFilter, setTempActiveFilter] = useState<FilterType>([]);

  // Ref untuk modal manpower
  const manpowerModalRef = useRef<HTMLDivElement>(null);

  // Tambahkan state untuk temporary manpower selection
  const [tempManpowerSelection, setTempManpowerSelection] = useState<{
    [key: string]: number[];
  }>({});

  // Load manpower from database on component mount
  useEffect(() => {
    const loadManpowerFromDatabase = async () => {
      try {
        // Load dari backend menggunakan API
        const response = await ManpowerService.getActiveManpowerTest();
        console.log("Manpower loaded:", response);
        setManpowerList(response || []);
      } catch (error) {
        console.error("Error loading manpower from database:", error);
        // Fallback to default manpower if database fails
        setManpowerList([
          { id: 1, name: "Operator 1" },
          { id: 2, name: "Operator 2" },
          { id: 3, name: "Operator 3" },
        ]);
      }
    };

    loadManpowerFromDatabase();
  }, []);

  // Recalculate akumulasi when validGroupedRows changes (component mount or data update)
  useEffect(() => {
    if (validGroupedRows.length > 0) {
      console.log(
        "🔄 ScheduleTableView: Recalculating akumulasi on component mount/data update",
      );
      recalculateAllAkumulasi(validGroupedRows);
    }
  }, [validGroupedRows]);

  // Clean up invalid manpower IDs when manpowerList changes
  useEffect(() => {
    const validManpowerIds = manpowerList.map((mp) => mp.id);

    // Clean up flatRows
    flatRows.forEach((row) => {
      if (row.manpowerIds && Array.isArray(row.manpowerIds)) {
        const validIds = row.manpowerIds.filter((id) =>
          validManpowerIds.includes(id),
        );
        if (validIds.length !== row.manpowerIds.length) {
          row.manpowerIds = validIds;
        }
      }
    });

    // Clean up validGroupedRows
    validGroupedRows.forEach((group) => {
      group.rows.forEach((row) => {
        if (row.manpowerIds && Array.isArray(row.manpowerIds)) {
          const validIds = row.manpowerIds.filter((id) =>
            validManpowerIds.includes(id),
          );
          if (validIds.length !== row.manpowerIds.length) {
            row.manpowerIds = validIds;
          }
        }
      });
    });

    // Notify parent component about data change if cleanup occurred
    if (onDataChange) {
      onDataChange([...flatRows]);
    }
  }, [manpowerList, flatRows, validGroupedRows, onDataChange]);

  // Tutup dropdown manpower jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;

      // Tutup modal manpower
      if (
        manpowerModalRef.current &&
        !manpowerModalRef.current.contains(event.target as Node)
      ) {
        setShowManpowerModal(false);
      }

      // Tutup filter dropdown jika klik di luar
      if (!target.closest(".filter-dropdown-container")) {
        setShowFilterDropdown(false);
      }

      // Untuk dropdown per cell - hanya tutup jika click di luar dropdown
      const isClickInsideDropdown = target.closest(".manpower-dropdown");

      if (!isClickInsideDropdown) {
        setFocusedInputs((prev) => {
          const newObj = { ...prev };
          Object.keys(newObj).forEach((k) => {
            if (k.endsWith("-manpowerDropdown")) newObj[k] = false;
          });
          return newObj;
        });
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fungsi untuk handle filter
  const handleOpenFilter = () => {
    setTempActiveFilter([...activeFilter]);
    setShowFilterDropdown(true);
  };

  const applyFilter = () => {
    setActiveFilter([...tempActiveFilter]);
    setShowFilterDropdown(false);
  };

  const cancelFilter = () => {
    setTempActiveFilter([...activeFilter]);
    setShowFilterDropdown(false);
  };

  // Calculate totals using utils
  const totals = calculateScheduleTotals(flatRows);

  // Calculate total jam produksi (cycle time) with manpower consideration
  const outputPerHour = calculateOutputPerHour(timePerPcs, []);
  const totalPlanningJam = formatJamProduksi(totals.planningPcs, outputPerHour);
  const totalOvertimeJam = formatJamProduksi(totals.overtimePcs, outputPerHour);

  // After validGroupedRows is received as a prop, filter out Sundays for display
  const { month, year } = parseScheduleName(scheduleName || "Juli 2025");
  const filteredValidGroupedRows = validGroupedRows.filter(
    (group) => getDayName(group.day, month, year) !== "Minggu",
  );

  // Gunakan ALL_ROWS dari utils
  const allRows = ALL_ROWS.map((row) => ({
    ...row,
    icon: getIconForRow(row.key),
  }));

  // Helper function untuk mendapatkan icon berdasarkan key
  function getIconForRow(key: string) {
    switch (key) {
      case "manpower":
        return Activity;
      case "delivery":
        return Truck;
      case "akumulasi-delivery":
        return TrendingUp;
      case "planning-pcs":
        return Target;
      case "planning-jam":
        return Clock;
      case "overtime-pcs":
        return Zap;
      case "overtime-jam":
        return Timer;
      case "jam-produksi":
        return Gauge;
      case "hasil-produksi":
        return Factory;
      case "akumulasi-hasil":
        return TrendingUp;
      case "jam-aktual":
        return Activity;
      case "actual-stock":
        return Package;
      case "rencana-stock":
        return Layers;
      default:
        return Activity;
    }
  }

  // Filter rows based on active filter
  const filteredRows = (
    activeFilter.length === 0
      ? ALL_ROWS
      : ALL_ROWS.filter((row) => activeFilter.includes(row.key))
  ).map((row) => ({
    ...row,
    icon: getIconForRow(row.key),
  }));

  // Function to handle input changes
  const handleInputChange = (rowId: string, field: string, value: string) => {
    const numericValue = Number(value) || 0;

    console.log(`🔄 handleInputChange called:`, {
      rowId,
      field,
      value,
      numericValue,
    });

    // Update the row data
    const row = flatRows.find((r) => r.id === rowId);
    if (row) {
      const oldValue = (row as any)[field];
      (row as any)[field] = numericValue;

      console.log(`📝 Updated row data:`, {
        rowId,
        field,
        oldValue,
        newValue: numericValue,
        shift: row.shift,
        day: row.day,
      });

      // Update edit form if available
      if (setEditForm) {
        setEditForm((prev) => ({
          ...prev,
          [field]: numericValue,
        }));
      }

      // Jika ada perubahan delivery, hitung ulang akumulasi
      if (field === "delivery" || field === "pcs") {
        console.log(
          `🔄 Recalculating akumulasi for field: ${field}, value: ${numericValue}, shift: ${row.shift}, day: ${row.day}`,
        );
        recalculateAllAkumulasi(validGroupedRows);
      }

      // Notify parent component about data change
      if (onDataChange) {
        onDataChange([...flatRows]);
      }
    } else {
      console.warn(`⚠️ Row not found for ID: ${rowId}`);
    }
  };

  // Filter options untuk ScheduleTableView
  const filterOptions = [
    { key: "manpower", label: "Manpower", icon: Activity },
    { key: "delivery", label: "Delivery Aktual", icon: Truck },
    {
      key: "akumulasi-delivery",
      label: "Akumulasi Delivery",
      icon: TrendingUp,
    },
    { key: "planning-pcs", label: "Planning PCS", icon: Target },
    { key: "planning-jam", label: "Planning Jam", icon: Clock },
    { key: "overtime-pcs", label: "Overtime PCS", icon: Zap },
    { key: "overtime-jam", label: "Overtime Jam", icon: Timer },
    { key: "jam-produksi", label: "Jam Produksi", icon: Gauge },
    { key: "hasil-produksi", label: "Hasil Produksi", icon: Factory },
    { key: "akumulasi-hasil", label: "Akumulasi Hasil", icon: TrendingUp },
    { key: "jam-aktual", label: "Jam Aktual", icon: Activity },
    { key: "actual-stock", label: "Actual Stock", icon: Package },
    { key: "rencana-stock", label: "Rencana Stock", icon: Layers },
  ];

  return (
    <div className="space-y-6">
      {/* Informasi Produk */}
      {productInfo &&
        (productInfo.partName ||
          productInfo.customer ||
          productInfo.lastSavedBy) && (
          <div
            className={`p-4 ${uiColors.bg.secondary} rounded-xl border ${uiColors.border.primary}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              {/* Informasi Part dan Customer */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                {productInfo.partName && (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-blue-400"
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
                    <span className={`text-sm ${uiColors.text.secondary}`}>
                      <span className="font-semibold text-blue-400">Part:</span>{" "}
                      {productInfo.partName}
                    </span>
                  </div>
                )}
                {productInfo.customer && (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-green-400"
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
                    <span className={`text-sm ${uiColors.text.secondary}`}>
                      <span className="font-semibold text-green-400">
                        Customer:
                      </span>{" "}
                      {productInfo.customer}
                    </span>
                  </div>
                )}
                {/* Informasi Bulan */}
                {scheduleName && (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className={`text-sm ${uiColors.text.secondary}`}>
                      <span className="font-semibold text-purple-400">
                        Periode:
                      </span>{" "}
                      {scheduleName}
                    </span>
                  </div>
                )}
              </div>

              {/* Informasi waktu terakhir saved */}
              {productInfo.lastSavedAt && (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className={`text-sm ${uiColors.text.secondary}`}>
                    <span className="font-semibold text-yellow-400">
                      Last Saved:
                    </span>{" "}
                    {new Date(productInfo.lastSavedAt).toLocaleString("id-ID")}
                    {productInfo.lastSavedBy && (
                      <span className="text-purple-400 ml-1">
                        by {productInfo.lastSavedBy.nama}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Filter Menu - Enhanced + Manpower Button */}
      <div
        className={`${uiColors.bg.secondary}/50 rounded-xl p-6 ${uiColors.border.primary}`}
      >
        {/* Info Stock Awal, Filter Data & Add Manpower */}
        <div className="flex flex-wrap gap-4 items-center mb-6 justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`${uiColors.bg.tertiary} ${uiColors.text.primary} rounded-lg px-4 py-2 font-semibold text-base flex items-center gap-2 shadow ${uiColors.border.primary}`}
            >
              <Package className={`w-5 h-5 ${uiColors.text.tertiary}`} />
              Stock Awal: <span className="ml-1">{initialStock}</span>
            </div>

            {/* Filter Data Button */}
            <div className="relative filter-dropdown-container">
              <button
                onClick={handleOpenFilter}
                className={`px-4 py-2 rounded-lg font-semibold border border-blue-400 text-blue-400 flex items-center gap-2 hover:bg-blue-900 transition`}
              >
                <Filter className="w-4 h-4" />
                Filter Data{" "}
                {activeFilter.length > 0 && (
                  <span className="ml-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                    ({activeFilter.length})
                  </span>
                )}
                <svg
                  className={`w-3 h-3 transition-transform ${showFilterDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Filter Dropdown */}
              {showFilterDropdown && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 filter-dropdown-container">
                  <div className="w-[600px] bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl p-6 animate-fadeInUp">
                    <div className="mb-4 border-b border-slate-600 pb-3 flex items-center gap-2">
                      <Filter className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-bold text-base">
                        Filter Data{" "}
                        {tempActiveFilter.length > 0 &&
                          `(${tempActiveFilter.length})`}
                      </span>
                    </div>

                    {/* Filter Options dalam Grid 3 Kolom */}
                    <div className="mb-4">
                      <button
                        onClick={() => setTempActiveFilter([])}
                        className={`w-full mb-3 text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${tempActiveFilter.length === 0 ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"}`}
                      >
                        <BarChart3 className="w-4 h-4" /> Semua Data
                      </button>

                      <div className="grid grid-cols-3 gap-2">
                        {filterOptions.map((option) => {
                          const IconComponent = option.icon;
                          return (
                            <button
                              key={option.key}
                              onClick={() => {
                                const currentFilters = [...tempActiveFilter];
                                if (currentFilters.includes(option.key)) {
                                  setTempActiveFilter(
                                    currentFilters.filter(
                                      (f) => f !== option.key,
                                    ),
                                  );
                                } else {
                                  setTempActiveFilter([
                                    ...currentFilters,
                                    option.key,
                                  ]);
                                }
                              }}
                              className={`text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-sm ${tempActiveFilter.includes(option.key) ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"}`}
                            >
                              <IconComponent className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-slate-600 pt-3">
                      <div className="flex gap-2">
                        <button
                          onClick={cancelFilter}
                          className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
                        >
                          Batal
                        </button>
                        <button
                          onClick={applyFilter}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                          Terapkan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base font-semibold ${uiColors.button.secondary.bg} ${uiColors.button.secondary.hover} ${uiColors.button.secondary.text} shadow ${uiColors.button.secondary.border} transition`}
            onClick={() => setShowManpowerModal(true)}
            type="button"
            title="Tambah Manpower"
          >
            <Plus className="w-5 h-5" />
            Add Manpower
          </button>
        </div>
      </div>

      {/* Table - Enhanced */}
      <div
        className={`relative ${uiColors.bg.secondary}/50 rounded-xl overflow-hidden ${uiColors.border.primary}`}
      >
        {/* MODAL MANPOWER */}
        {showManpowerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div
              ref={manpowerModalRef}
              className={`${uiColors.bg.tertiary} rounded-xl p-6 w-full max-w-md ${uiColors.border.primary} shadow-2xl relative`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold ${uiColors.text.primary}`}>
                  Daftar Manpower
                </h2>
                <button
                  onClick={() => setShowManpowerModal(false)}
                  className={`text-2xl ${uiColors.text.tertiary} hover:${uiColors.text.primary}`}
                >
                  ×
                </button>
              </div>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newManpower}
                  onChange={(e) => setNewManpower(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-lg ${uiColors.bg.secondary} ${uiColors.border.secondary} ${uiColors.text.primary} focus:outline-none`}
                  placeholder="Nama manpower baru"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddManpower();
                  }}
                />
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center"
                  onClick={async () => {
                    try {
                      if (!newManpower.trim()) {
                        setManpowerError("Nama manpower tidak boleh kosong");
                        return;
                      }

                      // Simpan ke backend menggunakan API
                      const response = await ManpowerService.createManpowerTest(
                        {
                          name: newManpower.trim(),
                        },
                      );

                      // Refresh manpowerList dari backend
                      const manpowerResponse =
                        await ManpowerService.getActiveManpowerTest();
                      setManpowerList(manpowerResponse || []);

                      // Tampilkan notifikasi sukses
                      setManpowerError(""); // Clear any previous errors
                      console.log(
                        `${newManpower.trim()} berhasil ditambahkan!`,
                      );

                      // Clear input field
                      setNewManpower("");

                      // Jangan tutup modal, biarkan tetap terbuka
                      // setShowManpowerModal(false);
                    } catch (error) {
                      console.error("Error adding manpower:", error);

                      // Fallback ke state lokal jika backend gagal
                      const newManpowerItem = {
                        id: Date.now(),
                        name: newManpower.trim(),
                      };
                      setManpowerList((prev) => [...prev, newManpowerItem]);

                      // Clear input field
                      setNewManpower("");

                      // Tampilkan error yang sesuai
                      if (
                        error.message &&
                        error.message.includes("ERR_CONNECTION_REFUSED")
                      ) {
                        console.log(
                          "Server tidak tersedia, data disimpan lokal",
                        );
                      } else if (
                        error.message &&
                        error.message.includes("Token tidak ada")
                      ) {
                        console.log(
                          "Silakan login terlebih dahulu, data disimpan lokal",
                        );
                      } else {
                        console.log(
                          "Gagal menyimpan ke database, data disimpan lokal",
                        );
                      }
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {manpowerList.length === 0 && (
                  <li
                    className={`${uiColors.text.tertiary} text-sm text-center py-4`}
                  >
                    Belum ada manpower.
                  </li>
                )}
                {manpowerList.map((mp, idx) => (
                  <li
                    key={mp.id}
                    className={`flex items-center justify-between ${uiColors.bg.secondary} rounded-lg px-3 py-2`}
                  >
                    <div className="flex flex-col">
                      <span className={`${uiColors.text.primary} font-medium`}>
                        {idx + 1}. {mp.name}
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          // Hapus dari backend menggunakan API
                          await ManpowerService.deleteManpowerTest(mp.id);

                          // Refresh manpowerList dari backend
                          const manpowerResponse =
                            await ManpowerService.getActiveManpowerTest();
                          setManpowerList(manpowerResponse || []);

                          // Tampilkan notifikasi sukses
                          console.log("Manpower berhasil dihapus!");
                        } catch (error) {
                          console.error("Error removing manpower:", error);

                          // Fallback ke state lokal jika backend gagal
                          handleRemoveManpower(mp.id);

                          // Tampilkan error yang sesuai
                          if (
                            error.message &&
                            error.message.includes("ERR_CONNECTION_REFUSED")
                          ) {
                            console.log(
                              "Server tidak tersedia, data dihapus lokal",
                            );
                          } else if (
                            error.message &&
                            error.message.includes("Token tidak ada")
                          ) {
                            console.log(
                              "Silakan login terlebih dahulu, data dihapus lokal",
                            );
                          } else {
                            console.log(
                              "Gagal menghapus dari database, data dihapus lokal",
                            );
                          }
                        }
                      }}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {/* Ganti notifikasi error manpower dengan pop up modal kecil di tengah layar */}
        {manpowerError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl min-w-[260px] max-w-xs relative animate-fade-in-out">
              <button
                className="absolute top-2 right-2 text-white/80 hover:text-white text-lg font-bold"
                onClick={() => setManpowerError("")}
                aria-label="Tutup"
              >
                ×
              </button>
              <div className="font-semibold text-base text-center">
                {manpowerError}
              </div>
            </div>
          </div>
        )}
        {/* Notifikasi sukses */}
        {manpowerSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl min-w-[260px] max-w-xs relative animate-fade-in-out">
              <button
                className="absolute top-2 right-2 text-white/80 hover:text-white text-lg font-bold"
                onClick={() => setManpowerSuccess("")}
                aria-label="Tutup"
              >
                ×
              </button>
              <div className="font-semibold text-base text-center">
                {manpowerSuccess}
              </div>
            </div>
          </div>
        )}

        {/* Container with horizontal scroll */}
        <div className="flex">
          {/* Frozen Left Column - DESCRIPTION */}
          <div
            className={`flex-shrink-0 ${uiColors.bg.tertiary} ${uiColors.border.secondary} w-48`}
          >
            {/* Header */}
            <div
              className={`h-24 flex items-center justify-center ${uiColors.bg.tertiary} ${uiColors.border.secondary} bg-opacity-90`}
            >
              <div
                className={`${uiColors.text.primary} font-bold text-lg text-center px-4`}
              >
                DESCRIPTION
              </div>
            </div>

            {/* Rows */}
            <div className="space-y-0">
              {filteredRows.map((row, index) => {
                // Gunakan utils untuk mendapatkan warna baris dengan dark theme support
                const { rowBgColor, textColor } = getRowColorConfig(
                  row.key,
                  theme === "dark",
                );

                return (
                  <div
                    key={row.key}
                    className={`h-16 flex items-center justify-center px-4 ${rowBgColor} ${uiColors.border.secondary} ${textColor} font-semibold text-sm text-center leading-tight bg-opacity-90`}
                  >
                    <div className="whitespace-pre-line">{row.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TOTAL Column - Enhanced */}
          <div
            className={`flex-shrink-0 ${uiColors.bg.tertiary} ${uiColors.border.secondary} w-40`}
          >
            {/* Header */}
            <div
              className={`h-24 flex items-center justify-center ${uiColors.bg.tertiary} ${uiColors.border.secondary} bg-opacity-90`}
            >
              <div
                className={`${uiColors.text.primary} font-bold text-lg text-center px-4`}
              >
                TOTAL
              </div>
            </div>

            {/* Total Rows */}
            <div className="space-y-0">
              {filteredRows.map((row, index) => {
                let totalValue = "-";
                // Gunakan utils untuk mendapatkan warna total dengan dark theme support
                const { bgColor, textColor } = getTotalColorConfig(
                  row.key,
                  theme === "dark",
                );

                switch (row.key) {
                  case "manpower":
                    // Hitung akumulasi total manpower dari awal sampai akhir (gunakan filteredValidGroupedRows)
                    const totalManpower = filteredValidGroupedRows.reduce(
                      (total, group) => {
                        const shift1 = group.rows.find((r) => r.shift === "1");
                        const shift2 = group.rows.find((r) => r.shift === "2");

                        const shift1Manpower = shift1?.manpowerIds?.length || 3; // default 3
                        const shift2Manpower = shift2?.manpowerIds?.length || 3; // default 3

                        return total + shift1Manpower + shift2Manpower;
                      },
                      0,
                    );
                    totalValue = totalManpower.toString();
                    break;
                  case "delivery":
                    totalValue = formatNumber(totals.delivery);
                    break;
                  case "akumulasi-delivery":
                    totalValue = formatNumber(
                      calculateTotalAkumulasiDelivery(filteredValidGroupedRows),
                    );
                    break;
                  case "planning-jam":
                    totalValue = totalPlanningJam;
                    break;
                  case "planning-pcs":
                    totalValue = formatNumber(totals.planningPcs);
                    break;
                  case "overtime-jam":
                    totalValue = totalOvertimeJam;
                    break;
                  case "overtime-pcs":
                    totalValue = formatNumber(totals.overtimePcs);
                    break;
                  case "jam-produksi":
                    totalValue = "-";
                    break;
                  case "hasil-produksi":
                    totalValue = formatNumber(totals.hasilProduksi);
                    break;
                  case "akumulasi-hasil":
                    totalValue = formatNumber(
                      calculateTotalAkumulasiHasilProduksi(
                        filteredValidGroupedRows,
                      ),
                    );
                    break;
                  case "jam-aktual":
                    totalValue = "-";
                    break;
                  case "actual-stock":
                    totalValue = "-";
                    break;
                  case "rencana-stock":
                    totalValue = "-";
                    break;
                }

                return (
                  <div
                    key={row.key}
                    className={`h-16 flex items-center justify-center ${bgColor} ${textColor} font-mono text-sm font-bold`}
                  >
                    {totalValue}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scrollable Right Section - Date Columns - Enhanced */}
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <div className="flex min-w-max">
              {filteredValidGroupedRows.map((group) => (
                <div
                  key={group.day}
                  data-date={group.day}
                  data-day-name={
                    formatValidDate(group.day, scheduleName || "Februari 2025")
                      .dayName
                  }
                  className={`flex-shrink-0 w-40 ${uiColors.border.secondary}`}
                >
                  {/* Date Header */}
                  <div
                    className={`h-24 ${uiColors.bg.tertiary} ${uiColors.border.secondary}`}
                  >
                    <div className="text-center p-3">
                      <div className={`${uiColors.text.primary} font-bold`}>
                        {(() => {
                          const dateInfo = formatValidDate(
                            group.day,
                            scheduleName || "Februari 2025",
                          );
                          return (
                            <div>
                              <div className="text-sm">{dateInfo.dayName}</div>
                              <div className="text-xl font-bold">
                                {group.day}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      {/* Shift Headers */}
                      <div className="grid grid-cols-2 gap-1 mt-2">
                        <div
                          data-shift="1"
                          className="bg-blue-600 text-white text-xs py-1 rounded font-semibold"
                        >
                          SHIFT 1
                        </div>
                        <div
                          data-shift="2"
                          className="bg-purple-600 text-white text-xs py-1 rounded font-semibold"
                        >
                          SHIFT 2
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Rows */}
                  <div className="space-y-0">
                    {filteredRows.map((row, rowIndex) => {
                      const shift1 = group.rows.find((r) => r.shift === "1");
                      const shift2 = group.rows.find((r) => r.shift === "2");
                      const groupIndex = validGroupedRows.findIndex(
                        (g) => g.day === group.day,
                      );

                      // Gunakan utils untuk mendapatkan warna baris dengan dark theme support
                      const { rowBgColor, textColor } = getRowColorConfig(
                        row.key,
                        theme === "dark",
                      );

                      // Gunakan utils untuk mendapatkan konfigurasi data baris
                      const {
                        shift1Value,
                        shift2Value,
                        isEditable,
                        shift1Field,
                        shift2Field,
                      } = getRowDataConfig(
                        row.key,
                        shift1,
                        shift2,
                        group,
                        validGroupedRows,
                        groupIndex,
                        initialStock,
                        manpowerList,
                        flatRows,
                        timePerPcs,
                      );

                      return (
                        <div
                          key={row.key}
                          className={`h-16 grid grid-cols-2 gap-0 ${uiColors.border.secondary} ${rowBgColor}`}
                        >
                          <div
                            data-shift="1"
                            data-row-type={row.key}
                            className={`text-center flex items-center justify-center ${textColor} font-mono text-sm font-semibold`}
                          >
                            {row.key === "manpower" && shift1 ? (
                              <ManpowerDropdown
                                shift={shift1}
                                manpowerList={manpowerList}
                                tempManpowerSelection={tempManpowerSelection}
                                setTempManpowerSelection={
                                  setTempManpowerSelection
                                }
                                focusedInputs={focusedInputs}
                                setFocusedInputs={setFocusedInputs}
                                setEditForm={setEditForm}
                                onDataChange={onDataChange}
                                flatRows={flatRows}
                                uiColors={uiColors}
                                setManpowerError={setManpowerError}
                              />
                            ) : isEditable && shift1Field ? (
                              <EditableCell
                                value={(shift1 as any)[shift1Field] || 0}
                                field={shift1Field}
                                rowId={shift1.id}
                                isFocused={
                                  focusedInputs[
                                    `${shift1.id}-${shift1Field}`
                                  ] || false
                                }
                                onFocus={() => {
                                  setFocusedInputs((prev) => ({
                                    ...prev,
                                    [`${shift1.id}-${shift1Field}`]: true,
                                  }));
                                }}
                                onBlur={() => {
                                  setFocusedInputs((prev) => ({
                                    ...prev,
                                    [`${shift1.id}-${shift1Field}`]: false,
                                  }));
                                }}
                                onChange={handleInputChange}
                                textColor={textColor}
                                step={"1"}
                                min="0"
                              />
                            ) : typeof shift1Value === "number" ? (
                              formatNumber(shift1Value)
                            ) : (
                              shift1Value
                            )}
                          </div>
                          <div
                            data-shift="2"
                            data-row-type={row.key}
                            className={`text-center flex items-center justify-center ${textColor} font-mono text-sm font-semibold`}
                          >
                            {row.key === "manpower" && shift2 ? (
                              <ManpowerDropdown
                                shift={shift2}
                                manpowerList={manpowerList}
                                tempManpowerSelection={tempManpowerSelection}
                                setTempManpowerSelection={
                                  setTempManpowerSelection
                                }
                                focusedInputs={focusedInputs}
                                setFocusedInputs={setFocusedInputs}
                                setEditForm={setEditForm}
                                onDataChange={onDataChange}
                                flatRows={flatRows}
                                uiColors={uiColors}
                                setManpowerError={setManpowerError}
                              />
                            ) : isEditable && shift2Field ? (
                              <EditableCell
                                value={(shift2 as any)[shift2Field] || 0}
                                field={shift2Field}
                                rowId={shift2.id}
                                isFocused={
                                  focusedInputs[
                                    `${shift2.id}-${shift2Field}`
                                  ] || false
                                }
                                onFocus={() => {
                                  setFocusedInputs((prev) => ({
                                    ...prev,
                                    [`${shift2.id}-${shift2Field}`]: true,
                                  }));
                                }}
                                onBlur={() => {
                                  setFocusedInputs((prev) => ({
                                    ...prev,
                                    [`${shift2.id}-${shift2Field}`]: false,
                                  }));
                                }}
                                onChange={handleInputChange}
                                textColor={textColor}
                                step={"1"}
                                min="0"
                              />
                            ) : typeof shift2Value === "number" ? (
                              formatNumber(shift2Value)
                            ) : (
                              shift2Value
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTableView;
