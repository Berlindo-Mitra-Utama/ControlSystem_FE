import React, { useState, useEffect, useRef } from "react";
import { ScheduleItem, ScheduleTableProps } from "../../types/scheduleTypes";
import { formatValidDate } from "../../utils/scheduleDateUtils";
import {
  calculateOutputFields,
  calculateOutputPerHour,
  calculateScheduleTotals,
  formatJamProduksi,
  formatNumber,
  formatNumberWithDecimal,
  calculateAkumulasiDelivery,
  calculateAkumulasiHasilProduksi,
  calculateStockCustom,
} from "../../utils/scheduleCalcUtils";
import {
  Calendar,
  Clock,
  Package,
  Truck,
  Timer,
  Factory,
  Calculator,
  TrendingUp,
  BarChart3,
  Filter,
  Database,
  Target,
  Zap,
  Gauge,
  Layers,
  Activity,
  Plus,
  Trash2,
  XCircle,
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
}

type FilterType =
  | "all"
  | "stock"
  | "delivery"
  | "planning"
  | "overtime"
  | "hasil-produksi";

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
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [focusedInputs, setFocusedInputs] = useState<{
    [key: string]: boolean;
  }>({});
  // State untuk popup dan list manpower
  const [showManpowerModal, setShowManpowerModal] = useState(false);
  // State untuk notifikasi error manpower
  const [manpowerError, setManpowerError] = useState<string>("");
  // Ref untuk modal manpower
  const manpowerModalRef = useRef<HTMLDivElement>(null);

  // Simpan manpowerList ke localStorage setiap kali berubah
  useEffect(() => {
    localStorage.setItem("berlindo_manpowerList", JSON.stringify(manpowerList));
  }, [manpowerList]);

  // Load manpowerList dari localStorage saat mount
  useEffect(() => {
    const saved = localStorage.getItem("berlindo_manpowerList");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setManpowerList(parsed);
      } catch {}
    }
  }, []);

  // Tutup dropdown manpower jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Tutup semua dropdown manpower
      if (
        manpowerModalRef.current &&
        !manpowerModalRef.current.contains(event.target as Node)
      ) {
        setShowManpowerModal(false);
      }
      // Untuk dropdown per cell
      setFocusedInputs((prev) => {
        const newObj = { ...prev };
        Object.keys(newObj).forEach((k) => {
          if (k.endsWith("-manpowerDropdown")) newObj[k] = false;
        });
        return newObj;
      });
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate totals using utils
  const totals = calculateScheduleTotals(flatRows);

  // Calculate total jam produksi (cycle time)
  const outputPerHour = calculateOutputPerHour(timePerPcs, []);
  const totalJamProduksi = formatJamProduksi(
    totals.hasilProduksi,
    outputPerHour,
  );
  const totalPlanningJam = formatJamProduksi(totals.planningPcs, outputPerHour);
  const totalOvertimeJam = formatJamProduksi(totals.overtimePcs, outputPerHour);

  // Define all rows with their categories and formatted labels
  const allRows = [
    {
      key: "stock-awal",
      label: "STOCK AWAL (PCS)",
      category: "stock",
      icon: Package,
    },
    {
      key: "manpower",
      label: "MANPOWER",
      category: "stock",
      icon: Activity,
    },
    {
      key: "delivery",
      label: "DELIVERY PLAN (PCS)",
      category: "delivery",
      icon: Truck,
    },
    {
      key: "akumulasi-delivery",
      label: "AKUMULASI\nDELIVERY (PCS)",
      category: "delivery",
      icon: TrendingUp,
    },
    {
      key: "planning-pcs",
      label: "PLANNING PRODUKSI (PCS)",
      category: "planning",
      icon: Target,
    },
    {
      key: "planning-jam",
      label: "PLANNING PRODUKSI (JAM)",
      category: "planning",
      icon: Clock,
    },
    {
      key: "overtime-pcs",
      label: "OVERTIME (PCS)",
      category: "overtime",
      icon: Zap,
    },
    {
      key: "overtime-jam",
      label: "OVERTIME (JAM)",
      category: "overtime",
      icon: Timer,
    },
    {
      key: "jam-produksi",
      label: "JAM PRODUKSI\n(CYCLETIME)",
      category: "stock",
      icon: Gauge,
    },
    {
      key: "hasil-produksi",
      label: "HASIL PRODUKSI\nAKTUAL (PCS)",
      category: "hasil-produksi",
      icon: Factory,
    },
    {
      key: "akumulasi-hasil",
      label: "AKUMULASI HASIL\nPRODUKSI AKTUAL (PCS)",
      category: "hasil-produksi",
      icon: TrendingUp,
    },
    {
      key: "jam-aktual",
      label: "JAM PRODUKSI\nAKTUAL",
      category: "stock",
      icon: Activity,
    },
    {
      key: "actual-stock",
      label: "ACTUAL STOCK\n(PCS)",
      category: "stock",
      icon: Package,
    },
    {
      key: "rencana-stock",
      label: "RENCANA STOCK\n(PCS)",
      category: "stock",
      icon: Layers,
    },
  ];

  // Filter rows based on active filter
  const getFilteredRows = () => {
    if (activeFilter === "all") return allRows;
    return allRows.filter((row) => row.category === activeFilter);
  };

  const filteredRows = getFilteredRows();

  // Function to handle input changes
  const handleInputChange = (rowId: string, field: string, value: string) => {
    const numericValue = Number(value) || 0;

    // Update the row data
    const row = flatRows.find((r) => r.id === rowId);
    if (row) {
      (row as any)[field] = numericValue;

      // Update edit form if available
      if (setEditForm) {
        setEditForm((prev) => ({
          ...prev,
          [field]: numericValue,
        }));
      }
    }
  };

  // Filter menu options
  const filterOptions = [
    { value: "all", label: "Semua Data", icon: BarChart3 },
    { value: "delivery", label: "Delivery", icon: Truck },
    { value: "planning", label: "Planning", icon: Target },
    { value: "overtime", label: "Overtime", icon: Timer },
    { value: "hasil-produksi", label: "Hasil Produksi", icon: Factory },
  ];

  return (
    <div className="space-y-6">
      {/* Filter Menu - Enhanced + Manpower Button */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-3">
          <Filter className="w-6 h-6 text-blue-400" />
          Filter Data
        </h3>
        <div className="flex flex-wrap gap-3 items-center">
          {filterOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value as FilterType)}
                className={`${
                  option.value === "all"
                    ? "px-4 py-2 rounded-lg text-sm font-medium"
                    : "px-6 py-3 rounded-xl text-base font-semibold"
                } transition-all flex items-center gap-2 ${
                  activeFilter === option.value
                    ? "bg-blue-600 text-white shadow-xl scale-105"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white hover:scale-102"
                }`}
              >
                <IconComponent
                  className={option.value === "all" ? "w-4 h-4" : "w-5 h-5"}
                />
                {option.label}
              </button>
            );
          })}
          {/* Gabungkan button Manpower di sini */}
          <button
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold bg-blue-700 hover:bg-blue-800 text-white shadow transition ml-2"
            onClick={() => setShowManpowerModal(true)}
            type="button"
          >
            <Activity className="w-5 h-5" />
            Manpower
          </button>
        </div>
      </div>

      {/* Table - Enhanced */}
      <div className="relative bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50">
        {/* MODAL MANPOWER */}
        {showManpowerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div
              ref={manpowerModalRef}
              className="bg-slate-900 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl relative"
            >
              <button
                className="absolute top-2 right-2 text-slate-400 hover:text-white"
                onClick={() => setShowManpowerModal(false)}
              >
                <XCircle className="w-6 h-6" />
              </button>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                Daftar Manpower
              </h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newManpower}
                  onChange={(e) => setNewManpower(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none"
                  placeholder="Nama manpower baru"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddManpower();
                  }}
                />
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center"
                  onClick={handleAddManpower}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {manpowerList.length === 0 && (
                  <li className="text-slate-400 text-sm">
                    Belum ada manpower.
                  </li>
                )}
                {manpowerList.map((mp, idx) => (
                  <li
                    key={mp.id}
                    className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2"
                  >
                    <span className="text-white font-medium">
                      {mp.id}. {mp.name}
                    </span>
                    <button
                      onClick={() => handleRemoveManpower(mp.id)}
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
        {/* Notifikasi error manpower */}
        {manpowerError && (
          <div className="bg-red-600 text-white text-center py-2 rounded mb-2 font-semibold">
            {manpowerError}
          </div>
        )}
        {/* Container with horizontal scroll */}
        <div className="flex">
          {/* Frozen Left Column - DESCRIPTION */}
          <div className="flex-shrink-0 bg-slate-700 border-r border-slate-600 w-48">
            {/* Header */}
            <div className="h-24 flex items-center justify-center bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600">
              <div className="text-white font-bold text-lg text-center px-4">
                DESCRIPTION
              </div>
            </div>

            {/* Rows */}
            <div className="space-y-0">
              {filteredRows.map((row, index) => (
                <div
                  key={row.key}
                  className="h-16 flex items-center justify-center px-4 bg-slate-700 border-b border-slate-600 text-white font-semibold text-sm text-center leading-tight"
                >
                  <div className="whitespace-pre-line">{row.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* TOTAL Column - Enhanced */}
          <div className="flex-shrink-0 bg-slate-600 border-r border-slate-500 w-40">
            {/* Header */}
            <div className="h-24 flex items-center justify-center bg-gradient-to-r from-slate-700 to-slate-600 border-b border-slate-500">
              <div className="text-white font-bold text-lg text-center px-4">
                TOTAL
              </div>
            </div>

            {/* Total Rows */}
            <div className="space-y-0">
              {filteredRows.map((row) => {
                let totalValue = "-";
                let bgColor = "bg-slate-600";
                let textColor = "text-slate-400";

                switch (row.key) {
                  case "stock-awal":
                    totalValue = "332";
                    bgColor = "bg-slate-800/50";
                    textColor = "text-slate-200";
                    break;
                  case "manpower":
                    // Hitung rata-rata manpower dari flatRows
                    const manpowerTotal = flatRows.reduce(
                      (sum, r) => sum + (r.manpower || 0),
                      0,
                    );
                    const manpowerCount = flatRows.filter(
                      (r) => typeof r.manpower === "number",
                    ).length;
                    totalValue = "-";
                    bgColor = "bg-slate-800/50";
                    textColor = "text-slate-200";
                    break;
                  case "delivery":
                    totalValue = formatNumber(totals.delivery);
                    bgColor = "bg-cyan-800/50";
                    textColor = "text-cyan-200";
                    break;
                  case "planning-jam":
                    totalValue = totalPlanningJam;
                    bgColor = "bg-yellow-800/50";
                    textColor = "text-yellow-200";
                    break;
                  case "planning-pcs":
                    totalValue = formatNumber(totals.planningPcs);
                    bgColor = "bg-yellow-800/50";
                    textColor = "text-yellow-200";
                    break;
                  case "overtime-jam":
                    totalValue = totalOvertimeJam;
                    bgColor = "bg-orange-800/50";
                    textColor = "text-orange-200";
                    break;
                  case "overtime-pcs":
                    totalValue = formatNumber(totals.overtimePcs);
                    bgColor = "bg-orange-800/50";
                    textColor = "text-orange-200";
                    break;
                  case "jam-produksi":
                    totalValue = "-";
                    bgColor = "bg-indigo-800/50";
                    textColor = "text-indigo-200";
                    break;
                  case "hasil-produksi":
                    totalValue = formatNumber(totals.hasilProduksi);
                    bgColor = "bg-purple-800/50";
                    textColor = "text-purple-200";
                    break;
                  case "jam-aktual":
                    totalValue = "-";
                    bgColor = "bg-green-800/50";
                    textColor = "text-green-200";
                    break;
                }

                return (
                  <div
                    key={row.key}
                    className={`h-16 flex items-center justify-center ${bgColor} border-b border-slate-500 ${textColor} font-mono text-sm font-bold`}
                  >
                    {totalValue}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scrollable Right Section - Date Columns - Enhanced */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex min-w-max">
              {validGroupedRows.map((group) => (
                <div
                  key={group.day}
                  className="flex-shrink-0 w-40 border-r border-slate-600"
                >
                  {/* Date Header */}
                  <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600">
                    <div className="text-center p-3">
                      <div className="text-white font-bold">
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
                        <div className="bg-blue-600/20 text-blue-300 text-sm py-1 rounded">
                          SHIFT 1
                        </div>
                        <div className="bg-purple-600/20 text-purple-300 text-sm py-1 rounded">
                          SHIFT 2
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Rows */}
                  <div className="space-y-0">
                    {filteredRows.map((row) => {
                      const shift1 = group.rows.find((r) => r.shift === "1");
                      const shift2 = group.rows.find((r) => r.shift === "2");
                      const groupIndex = validGroupedRows.findIndex(
                        (g) => g.day === group.day,
                      );

                      let shift1Value: string | number = "-";
                      let shift2Value: string | number = "-";
                      let bgColor = "bg-slate-800";
                      let textColor = "text-white";
                      let isEditable = false;
                      let shift1Field = "";
                      let shift2Field = "";

                      switch (row.key) {
                        case "stock-awal":
                          shift1Value = "-";
                          shift2Value = "-";
                          bgColor = "bg-slate-800";
                          textColor = "text-slate-200";
                          break;
                        case "manpower":
                          shift1Value =
                            shift1?.manpowerIds && shift1.manpowerIds.length > 0
                              ? shift1.manpowerIds
                                  .map((id) => {
                                    const mp = manpowerList.find(
                                      (mp) => mp.id === id,
                                    );
                                    return mp ? mp.name : null;
                                  })
                                  .filter(Boolean)
                                  .join(", ")
                              : "Pilih";
                          shift2Value =
                            shift2?.manpowerIds && shift2.manpowerIds.length > 0
                              ? shift2.manpowerIds
                                  .map((id) => {
                                    const mp = manpowerList.find(
                                      (mp) => mp.id === id,
                                    );
                                    return mp ? mp.name : null;
                                  })
                                  .filter(Boolean)
                                  .join(", ")
                              : "Pilih";
                          bgColor = "bg-slate-800";
                          textColor = "text-slate-200";
                          isEditable = true;
                          shift1Field = "manpower";
                          shift2Field = "manpower";
                          break;
                        case "delivery":
                          shift1Value = shift1?.delivery || 0;
                          shift2Value = shift2?.delivery || 0;
                          bgColor = "bg-cyan-900/30";
                          textColor = "text-cyan-300";
                          isEditable = true;
                          shift1Field = "delivery";
                          shift2Field = "delivery";
                          break;

                        case "akumulasi-delivery":
                          // Calculate akumulasi delivery using utils
                          const akumulasiDelivery = calculateAkumulasiDelivery(
                            group.day,
                            validGroupedRows,
                            groupIndex,
                          );

                          if (shift1) {
                            shift1.akumulasiDelivery = akumulasiDelivery.shift1;
                          }
                          if (shift2) {
                            shift2.akumulasiDelivery = akumulasiDelivery.shift2;
                          }

                          shift1Value = formatNumber(akumulasiDelivery.shift1);
                          shift2Value = formatNumber(akumulasiDelivery.shift2);
                          bgColor = "bg-cyan-900/20";
                          textColor = "text-cyan-200";
                          break;

                        case "planning-jam":
                          const planningProduksiJamShift1 = formatJamProduksi(
                            shift1?.planningPcs || 0,
                            outputPerHour,
                          );

                          const planningProduksiJamShift2 = formatJamProduksi(
                            shift2?.planningPcs || 0,
                            outputPerHour,
                          );

                          shift1Value = planningProduksiJamShift1;
                          shift2Value = planningProduksiJamShift2;
                          bgColor = "bg-yellow-900/30";
                          textColor = "text-yellow-300";
                          break;

                        case "planning-pcs":
                          shift1Value = shift1?.planningPcs || 0;
                          shift2Value = shift2?.planningPcs || 0;
                          bgColor = "bg-yellow-900/30";
                          textColor = "text-yellow-300";
                          isEditable = true;
                          shift1Field = "planningPcs";
                          shift2Field = "planningPcs";
                          break;

                        case "overtime-jam":
                          const overtimeJamShift1 = formatJamProduksi(
                            shift1?.overtimePcs || 0,
                            outputPerHour,
                          );

                          const overtimeJamShift2 = formatJamProduksi(
                            shift2?.overtimePcs || 0,
                            outputPerHour,
                          );

                          shift1Value = overtimeJamShift1;
                          shift2Value = overtimeJamShift2;
                          bgColor = "bg-orange-900/30";
                          textColor = "text-orange-300";
                          break;

                        case "overtime-pcs":
                          shift1Value = shift1?.overtimePcs || 0;
                          shift2Value = shift2?.overtimePcs || 0;
                          bgColor = "bg-orange-900/30";
                          textColor = "text-orange-300";
                          isEditable = true;
                          shift1Field = "overtimePcs";
                          shift2Field = "overtimePcs";
                          break;

                        case "jam-produksi":
                          const jamProduksiShift1 = formatJamProduksi(
                            shift1?.pcs || 0,
                            outputPerHour,
                          );

                          const jamProduksiShift2 = formatJamProduksi(
                            shift2?.pcs || 0,
                            outputPerHour,
                          );

                          shift1Value = jamProduksiShift1;
                          shift2Value = jamProduksiShift2;
                          bgColor = "bg-indigo-900/30";
                          textColor = "text-indigo-300";
                          break;

                        case "hasil-produksi":
                          shift1Value = shift1?.pcs || 0;
                          shift2Value = shift2?.pcs || 0;
                          bgColor = "bg-purple-900/30";
                          textColor = "text-purple-300";
                          isEditable = true;
                          shift1Field = "pcs";
                          shift2Field = "pcs";
                          break;

                        case "akumulasi-hasil":
                          // Calculate akumulasi hasil produksi aktual using utils
                          const akumulasiHasil =
                            calculateAkumulasiHasilProduksi(
                              group.day,
                              validGroupedRows,
                              groupIndex,
                            );

                          if (shift1) {
                            shift1.akumulasiHasilProduksi =
                              akumulasiHasil.shift1;
                          }
                          if (shift2) {
                            shift2.akumulasiHasilProduksi =
                              akumulasiHasil.shift2;
                          }

                          shift1Value = formatNumber(akumulasiHasil.shift1);
                          shift2Value = formatNumber(akumulasiHasil.shift2);
                          bgColor = "bg-purple-900/20";
                          textColor = "text-purple-200";
                          break;

                        case "jam-aktual":
                          shift1Value = formatNumberWithDecimal(
                            shift1?.jamProduksiAktual || 0,
                          );
                          shift2Value = formatNumberWithDecimal(
                            shift2?.jamProduksiAktual || 0,
                          );
                          bgColor = "bg-green-900/30";
                          textColor = "text-green-300";
                          isEditable = true;
                          shift1Field = "jamProduksiAktual";
                          shift2Field = "jamProduksiAktual";
                          break;

                        case "actual-stock":
                          // Calculate actual stock using utils
                          if (shift1) {
                            const stockCustom1 = calculateStockCustom(
                              shift1,
                              group,
                              validGroupedRows,
                              groupIndex,
                              initialStock,
                            );
                            shift1.actualStockCustom = stockCustom1.actualStock;
                            shift1Value = formatNumber(
                              stockCustom1.actualStock,
                            );
                          }

                          if (shift2) {
                            const stockCustom2 = calculateStockCustom(
                              shift2,
                              group,
                              validGroupedRows,
                              groupIndex,
                              initialStock,
                            );
                            shift2.actualStockCustom = stockCustom2.actualStock;
                            shift2Value = formatNumber(
                              stockCustom2.actualStock,
                            );
                          }

                          bgColor = "bg-emerald-900/30";
                          textColor = "text-emerald-300";
                          break;

                        case "rencana-stock":
                          // Calculate rencana stock using utils
                          if (shift1) {
                            const stockCustom1 = calculateStockCustom(
                              shift1,
                              group,
                              validGroupedRows,
                              groupIndex,
                              initialStock,
                            );
                            shift1.rencanaStockCustom =
                              stockCustom1.rencanaStock;
                            shift1Value = formatNumber(
                              stockCustom1.rencanaStock,
                            );
                          }

                          if (shift2) {
                            const stockCustom2 = calculateStockCustom(
                              shift2,
                              group,
                              validGroupedRows,
                              groupIndex,
                              initialStock,
                            );
                            shift2.rencanaStockCustom =
                              stockCustom2.rencanaStock;
                            shift2Value = formatNumber(
                              stockCustom2.rencanaStock,
                            );
                          }

                          bgColor = "bg-amber-900/30";
                          textColor = "text-amber-300";
                          break;
                      }

                      return (
                        <div
                          key={row.key}
                          className="h-16 grid grid-cols-2 gap-1 border-b border-slate-600"
                        >
                          <div
                            className={`${bgColor} text-center flex items-center justify-center ${textColor} font-mono text-sm font-semibold`}
                          >
                            {row.key === "manpower" && shift1 ? (
                              <div className="relative w-full">
                                <button
                                  type="button"
                                  className="w-full bg-transparent border-none text-center focus:outline-none flex items-center justify-center gap-2 px-2 py-1 rounded-lg border border-blue-400"
                                  onClick={() =>
                                    setFocusedInputs((prev) => ({
                                      ...prev,
                                      [`${shift1.id}-manpowerDropdown`]:
                                        !prev[`${shift1.id}-manpowerDropdown`],
                                    }))
                                  }
                                >
                                  {shift1.manpowerIds &&
                                  shift1.manpowerIds.length > 0
                                    ? shift1.manpowerIds.join(".")
                                    : "Pilih"}
                                  <span className="ml-2">▼</span>
                                </button>
                                {focusedInputs[
                                  `${shift1.id}-manpowerDropdown`
                                ] && (
                                  <div className="absolute z-20 min-w-max max-w-xs bg-slate-900 border border-blue-400 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-xl">
                                    {manpowerList.map((mp) => (
                                      <label
                                        key={mp.id}
                                        className="flex flex-row items-center gap-2 px-3 py-2 hover:bg-blue-800 cursor-pointer whitespace-nowrap"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={
                                            shift1.manpowerIds &&
                                            shift1.manpowerIds.includes(mp.id)
                                          }
                                          disabled={
                                            shift1.manpowerIds &&
                                            shift1.manpowerIds.length >= 6 &&
                                            !shift1.manpowerIds.includes(mp.id)
                                          }
                                          onChange={(e) => {
                                            let newIds = shift1.manpowerIds
                                              ? [...shift1.manpowerIds]
                                              : [];
                                            if (e.target.checked) {
                                              if (newIds.length < 6)
                                                newIds.push(mp.id);
                                            } else {
                                              newIds = newIds.filter(
                                                (id) => id !== mp.id,
                                              );
                                            }
                                            shift1.manpowerIds = newIds;
                                            if (setEditForm)
                                              setEditForm((prev) => ({
                                                ...prev,
                                                manpowerIds: newIds,
                                              }));
                                          }}
                                          className="mr-2"
                                        />
                                        <span className="text-blue-100">
                                          {mp.id}. {mp.name}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                                {/* Tidak ada badge/chip ID di bawah field */}
                                {shift1.manpowerIds &&
                                  shift1.manpowerIds.length > 6 && (
                                    <div className="text-red-400 text-xs mt-1">
                                      Maksimal 6 manpower per shift.
                                    </div>
                                  )}
                              </div>
                            ) : typeof shift1Value === "number" ? (
                              formatNumber(shift1Value)
                            ) : (
                              shift1Value
                            )}
                          </div>
                          <div
                            className={`${bgColor} text-center flex items-center justify-center ${textColor} font-mono text-sm font-semibold`}
                          >
                            {row.key === "manpower" && shift2 ? (
                              <div className="relative w-full">
                                <button
                                  type="button"
                                  className="w-full bg-transparent border-none text-center focus:outline-none flex items-center justify-center gap-2 px-2 py-1 rounded-lg border border-blue-400"
                                  onClick={() =>
                                    setFocusedInputs((prev) => ({
                                      ...prev,
                                      [`${shift2.id}-manpowerDropdown`]:
                                        !prev[`${shift2.id}-manpowerDropdown`],
                                    }))
                                  }
                                >
                                  {shift2.manpowerIds &&
                                  shift2.manpowerIds.length > 0
                                    ? shift2.manpowerIds.join(".")
                                    : "Pilih"}
                                  <span className="ml-2">▼</span>
                                </button>
                                {focusedInputs[
                                  `${shift2.id}-manpowerDropdown`
                                ] && (
                                  <div className="absolute z-20 min-w-max max-w-xs bg-slate-900 border border-blue-400 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-xl">
                                    {manpowerList.map((mp) => (
                                      <label
                                        key={mp.id}
                                        className="flex flex-row items-center gap-2 px-3 py-2 hover:bg-blue-800 cursor-pointer whitespace-nowrap"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={
                                            shift2.manpowerIds &&
                                            shift2.manpowerIds.includes(mp.id)
                                          }
                                          disabled={
                                            shift2.manpowerIds &&
                                            shift2.manpowerIds.length >= 6 &&
                                            !shift2.manpowerIds.includes(mp.id)
                                          }
                                          onChange={(e) => {
                                            let newIds = shift2.manpowerIds
                                              ? [...shift2.manpowerIds]
                                              : [];
                                            if (e.target.checked) {
                                              if (newIds.length < 6)
                                                newIds.push(mp.id);
                                            } else {
                                              newIds = newIds.filter(
                                                (id) => id !== mp.id,
                                              );
                                            }
                                            shift2.manpowerIds = newIds;
                                            if (setEditForm)
                                              setEditForm((prev) => ({
                                                ...prev,
                                                manpowerIds: newIds,
                                              }));
                                          }}
                                          className="mr-2"
                                        />
                                        <span className="text-blue-100">
                                          {mp.id}. {mp.name}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                                {/* Tidak ada badge/chip ID di bawah field */}
                                {shift2.manpowerIds &&
                                  shift2.manpowerIds.length > 6 && (
                                    <div className="text-red-400 text-xs mt-1">
                                      Maksimal 6 manpower per shift.
                                    </div>
                                  )}
                              </div>
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
