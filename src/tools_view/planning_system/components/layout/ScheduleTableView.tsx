import React, { useState, useEffect, useRef } from "react";
import { ScheduleItem, ScheduleTableProps } from "../../types/scheduleTypes";
import { getCategoryColor } from "../../../const/colors";
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
  calculateAkumulasiDelivery,
  calculateAkumulasiHasilProduksi,
  calculateStockCustom,
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
  onDataChange?: (updatedRows: ScheduleItem[]) => void;
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
  onDataChange,
}) => {
  const { uiColors, theme } = useTheme();
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

  // Tambahkan state untuk temporary manpower selection
  const [tempManpowerSelection, setTempManpowerSelection] = useState<{
    [key: string]: number[];
  }>({});

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
      // Tutup modal manpower
      if (
        manpowerModalRef.current &&
        !manpowerModalRef.current.contains(event.target as Node)
      ) {
        setShowManpowerModal(false);
      }

      // Untuk dropdown per cell - hanya tutup jika click di luar dropdown
      const target = event.target as Element;
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

  // Calculate totals using utils
  const totals = calculateScheduleTotals(flatRows);

  // Calculate total jam produksi (cycle time) with manpower consideration
  const outputPerHour = calculateOutputPerHour(timePerPcs, []);
  const totalJamProduksi = formatJamProduksi(
    totals.hasilProduksi,
    outputPerHour,
  );
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
  const filteredRows = getFilteredRows(activeFilter).map((row) => ({
    ...row,
    icon: getIconForRow(row.key),
  }));

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

      // Notify parent component about data change
      if (onDataChange) {
        onDataChange([...flatRows]);
      }
    }
  };

  // Filter menu options dengan icon
  const filterOptions = FILTER_OPTIONS.map((option) => ({
    ...option,
    icon: getIconForFilter(option.value),
  }));

  // Helper function untuk mendapatkan icon filter
  function getIconForFilter(value: string) {
    switch (value) {
      case "all":
        return BarChart3;
      case "delivery":
        return Truck;
      case "planning":
        return Target;
      case "overtime":
        return Timer;
      case "hasil-produksi":
        return Factory;
      default:
        return BarChart3;
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Menu - Enhanced + Manpower Button */}
      <div
        className={`${uiColors.bg.secondary}/50 rounded-xl p-6 ${uiColors.border.primary}`}
      >
        {/* Info Stock Awal & Add Manpower */}
        <div className="flex flex-wrap gap-4 items-center mb-6 justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`${uiColors.bg.tertiary} ${uiColors.text.primary} rounded-lg px-4 py-2 font-semibold text-base flex items-center gap-2 shadow ${uiColors.border.primary}`}
            >
              <Package className="w-5 h-5 text-slate-600" />
              Stock Awal: <span className="ml-1">{initialStock}</span>
            </div>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-base font-semibold bg-slate-700 hover:bg-slate-800 text-white shadow border border-slate-600 transition"
            onClick={() => setShowManpowerModal(true)}
            type="button"
            title="Tambah Manpower"
          >
            <Plus className="w-5 h-5" />
            Add Manpower
          </button>
        </div>
        {/* Divider */}
        <div className={`border-b ${uiColors.border.secondary} mb-4`} />
        {/* Judul Filter Data */}
        <h3
          className={`${uiColors.text.primary} font-bold text-lg mb-4 flex items-center gap-3`}
        >
          <Filter className="w-6 h-6 text-slate-600" />
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
                    ? "bg-slate-700 text-white shadow-xl scale-105"
                    : `${uiColors.bg.tertiary} ${uiColors.text.tertiary} hover:${uiColors.bg.secondary} hover:${uiColors.text.primary} hover:scale-102`
                }`}
              >
                <IconComponent
                  className={option.value === "all" ? "w-4 h-4" : "w-5 h-5"}
                />
                {option.label}
              </button>
            );
          })}
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
              <button
                className={`absolute top-2 right-2 ${uiColors.text.tertiary} hover:${uiColors.text.primary}`}
                onClick={() => setShowManpowerModal(false)}
              >
                <XCircle className="w-6 h-6" />
              </button>
              <h3
                className={`text-lg font-bold ${uiColors.text.primary} mb-4 flex items-center gap-2`}
              >
                <Activity className="w-5 h-5 text-green-400" />
                Daftar Manpower
              </h3>
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
                  onClick={handleAddManpower}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {manpowerList.length === 0 && (
                  <li className={`${uiColors.text.tertiary} text-sm`}>
                    Belum ada manpower.
                  </li>
                )}
                {manpowerList.map((mp, idx) => (
                  <li
                    key={mp.id}
                    className={`flex items-center justify-between ${uiColors.bg.secondary} rounded-lg px-3 py-2`}
                  >
                    <span className={`${uiColors.text.primary} font-medium`}>
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

        {/* Container with horizontal scroll */}
        <div className="flex">
          {/* Frozen Left Column - DESCRIPTION */}
          <div
            className={`flex-shrink-0 ${uiColors.bg.tertiary} ${uiColors.border.secondary} w-48`}
          >
            {/* Header */}
            <div
              className={`h-24 flex items-center justify-center ${uiColors.bg.tertiary} ${uiColors.border.secondary}`}
            >
              <div
                className={`${uiColors.text.primary} font-bold text-lg text-center px-4`}
              >
                DESCRIPTION
              </div>
            </div>

            {/* Rows */}
            <div className="space-y-0">
              {filteredRows.map((row, index) => (
                <div
                  key={row.key}
                  className={`h-16 flex items-center justify-center px-4 ${uiColors.bg.tertiary} ${uiColors.border.secondary} ${uiColors.text.primary} font-semibold text-sm text-center leading-tight`}
                >
                  <div className="whitespace-pre-line">{row.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* TOTAL Column - Enhanced */}
          <div
            className={`flex-shrink-0 ${uiColors.bg.tertiary} ${uiColors.border.secondary} w-40`}
          >
            {/* Header */}
            <div
              className={`h-24 flex items-center justify-center ${uiColors.bg.secondary} ${uiColors.border.secondary}`}
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
                    totalValue = "-";
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
                    totalValue = "-";
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
          <div className="flex-1 overflow-x-auto">
            <div className="flex min-w-max">
              {filteredValidGroupedRows.map((group) => (
                <div
                  key={group.day}
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
                        <div className="bg-blue-500/20 text-blue-700 text-sm py-1 rounded font-semibold">
                          SHIFT 1
                        </div>
                        <div className="bg-purple-500/20 text-purple-700 text-sm py-1 rounded font-semibold">
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
                      );

                      return (
                        <div
                          key={row.key}
                          className={`h-16 grid grid-cols-2 gap-1 ${uiColors.border.secondary} ${rowBgColor}`}
                        >
                          <div
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
                                step={
                                  shift1Field === "jamProduksiAktual"
                                    ? "0.1"
                                    : "1"
                                }
                                min="0"
                              />
                            ) : typeof shift1Value === "number" ? (
                              formatNumber(shift1Value)
                            ) : (
                              shift1Value
                            )}
                          </div>
                          <div
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
                                step={
                                  shift2Field === "jamProduksiAktual"
                                    ? "0.1"
                                    : "1"
                                }
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
