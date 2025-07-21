import React, { useState } from "react";
import { ScheduleItem, ScheduleTableProps } from "../../types/scheduleTypes";
import { formatValidDate } from "../../utils/scheduleDateUtils";
import { calculateOutputFields } from "../../utils/scheduleCalcUtils";

interface ScheduleTableViewProps {
  validGroupedRows: { day: number; rows: ScheduleItem[] }[];
  flatRows: ScheduleItem[];
  timePerPcs: number;
  initialStock: number;
  scheduleName?: string;
}

type FilterType =
  | "all"
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
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Calculate totals
  const totals = {
    delivery: flatRows.reduce((sum, row) => sum + (row.delivery || 0), 0),
    planningPcs: flatRows.reduce((sum, row) => sum + (row.planningPcs || 0), 0),
    overtimePcs: flatRows.reduce((sum, row) => sum + (row.overtimePcs || 0), 0),
    hasilProduksi: flatRows.reduce((sum, row) => sum + (row.pcs || 0), 0),
    jamProduksiAktual: flatRows.reduce(
      (sum, row) => sum + (row.jamProduksiAktual || 0),
      0,
    ),
  };

  // Calculate total jam produksi (cycle time)
  const outputPerHour = timePerPcs > 0 ? Math.floor(3600 / timePerPcs) : 0;
  const totalJamProduksi =
    totals.hasilProduksi > 0 && outputPerHour > 0
      ? (Math.ceil((totals.hasilProduksi / outputPerHour) * 10) / 10).toFixed(1)
      : "0.0";

  // Calculate total planning hours
  const totalPlanningJam =
    totals.planningPcs > 0 && outputPerHour > 0
      ? (Math.ceil((totals.planningPcs / outputPerHour) * 10) / 10).toFixed(1)
      : "0.0";

  // Calculate total overtime hours
  const totalOvertimeJam =
    totals.overtimePcs > 0 && outputPerHour > 0
      ? (Math.ceil((totals.overtimePcs / outputPerHour) * 10) / 10).toFixed(1)
      : "0.0";

  // Define all rows with their categories and formatted labels
  const allRows = [
    { key: "stock", label: "STOCK (PCS)", category: "stock" },
    { key: "delivery", label: "DELIVERY (PCS)", category: "delivery" },
    {
      key: "akumulasi-delivery",
      label: "AKUMULASI\nDELIVERY (PCS)",
      category: "delivery",
    },
    { key: "planning-jam", label: "PLANNING (JAM)", category: "planning" },
    { key: "planning-pcs", label: "PLANNING (PCS)", category: "planning" },
    { key: "overtime-jam", label: "OVERTIME (JAM)", category: "overtime" },
    { key: "overtime-pcs", label: "OVERTIME (PCS)", category: "overtime" },
    {
      key: "jam-produksi",
      label: "JAM PRODUKSI\n(CYCLETIME)",
      category: "stock",
    },
    {
      key: "hasil-produksi",
      label: "HASIL\nPRODUKSI (PCS)",
      category: "hasil-produksi",
    },
    {
      key: "akumulasi-hasil",
      label: "AKUMULASI HASIL\nPRODUKSI (PCS)",
      category: "hasil-produksi",
    },
    { key: "jam-aktual", label: "JAM PRODUKSI\nAKTUAL", category: "stock" },
    { key: "teori-stock", label: "TEORI STOCK\n(PCS)", category: "stock" },
    { key: "actual-stock", label: "ACTUAL STOCK\n(PCS)", category: "stock" },
    { key: "rencana-stock", label: "RENCANA STOCK\n(PCS)", category: "stock" },
  ];

  // Filter rows based on active filter
  const getFilteredRows = () => {
    if (activeFilter === "all") return allRows;
    return allRows.filter((row) => row.category === activeFilter);
  };

  const filteredRows = getFilteredRows();

  // Filter menu options
  const filterOptions = [
    { value: "all", label: "Semua Data", icon: "📊" },
    { value: "delivery", label: "Delivery", icon: "🚚" },
    { value: "planning", label: "Planning", icon: "📋" },
    { value: "overtime", label: "Overtime", icon: "⏰" },
    { value: "hasil-produksi", label: "Hasil Produksi", icon: "🏭" },
  ];

  return (
    <div className="space-y-6">
      {/* Filter Menu - Enhanced */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-3">
          <span className="text-2xl">🔍</span>
          Filter Data
        </h3>
        <div className="flex flex-wrap gap-3">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setActiveFilter(option.value as FilterType)}
              className={`${
                option.value === "all"
                  ? "px-4 py-2 rounded-lg text-sm font-medium" // Smaller for "Semua Data"
                  : "px-6 py-3 rounded-xl text-base font-semibold" // Larger for others
              } transition-all flex items-center gap-2 ${
                activeFilter === option.value
                  ? "bg-blue-600 text-white shadow-xl scale-105"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white hover:scale-102"
              }`}
            >
              <span className={option.value === "all" ? "text-lg" : "text-xl"}>
                {option.icon}
              </span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table - Enhanced */}
      <div className="relative bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50">
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
                  case "delivery":
                    totalValue = totals.delivery.toLocaleString();
                    bgColor = "bg-cyan-800/50";
                    textColor = "text-cyan-200";
                    break;
                  case "planning-jam":
                    totalValue = totalPlanningJam;
                    bgColor = "bg-yellow-800/50";
                    textColor = "text-yellow-200";
                    break;
                  case "planning-pcs":
                    totalValue = totals.planningPcs.toLocaleString();
                    bgColor = "bg-yellow-800/50";
                    textColor = "text-yellow-200";
                    break;
                  case "overtime-jam":
                    totalValue = totalOvertimeJam;
                    bgColor = "bg-orange-800/50";
                    textColor = "text-orange-200";
                    break;
                  case "overtime-pcs":
                    totalValue = totals.overtimePcs.toLocaleString();
                    bgColor = "bg-orange-800/50";
                    textColor = "text-orange-200";
                    break;
                  case "jam-produksi":
                    totalValue = totalJamProduksi;
                    bgColor = "bg-indigo-800/50";
                    textColor = "text-indigo-200";
                    break;
                  case "hasil-produksi":
                    totalValue = totals.hasilProduksi.toLocaleString();
                    bgColor = "bg-purple-800/50";
                    textColor = "text-purple-200";
                    break;
                  case "jam-aktual":
                    totalValue = totals.jamProduksiAktual.toFixed(1);
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

                      let shift1Value = "-";
                      let shift2Value = "-";
                      let bgColor = "bg-slate-800";
                      let textColor = "text-white";

                      switch (row.key) {
                        case "stock":
                          if (shift1) {
                            const shift1Calc = calculateOutputFields(
                              shift1,
                              flatRows.findIndex((r) => r.id === shift1.id),
                              flatRows,
                              timePerPcs,
                              initialStock,
                            );
                            shift1Value = shift1Calc.prevStock.toLocaleString();
                          }
                          if (shift2) {
                            const shift2Calc = calculateOutputFields(
                              shift2,
                              flatRows.findIndex((r) => r.id === shift2.id),
                              flatRows,
                              timePerPcs,
                              initialStock,
                            );
                            shift2Value = shift2Calc.prevStock.toLocaleString();
                          }
                          break;

                        case "delivery":
                          shift1Value =
                            shift1?.delivery?.toLocaleString() || "0";
                          shift2Value =
                            shift2?.delivery?.toLocaleString() || "0";
                          bgColor = "bg-cyan-900/30";
                          textColor = "text-cyan-300";
                          break;

                        case "akumulasi-delivery":
                          // Calculate akumulasi delivery
                          let akumulasiShift1 = 0;
                          let akumulasiShift2 = 0;

                          if (shift1) {
                            if (groupIndex === 0) {
                              akumulasiShift1 = shift1.delivery || 0;
                            } else {
                              const prevGroup =
                                validGroupedRows[groupIndex - 1];
                              const prevShift2 = prevGroup.rows.find(
                                (r) => r.shift === "2",
                              );
                              const prevAkumulasi = prevShift2
                                ? prevShift2.akumulasiDelivery || 0
                                : 0;
                              akumulasiShift1 =
                                prevAkumulasi + (shift1.delivery || 0);
                            }
                            shift1.akumulasiDelivery = akumulasiShift1;
                          }

                          if (shift2) {
                            akumulasiShift2 =
                              akumulasiShift1 + (shift2.delivery || 0);
                            shift2.akumulasiDelivery = akumulasiShift2;
                          }

                          shift1Value = akumulasiShift1.toLocaleString();
                          shift2Value = akumulasiShift2.toLocaleString();
                          bgColor = "bg-cyan-900/20";
                          textColor = "text-cyan-200";
                          break;

                        case "planning-jam":
                          const planningJamShift1 =
                            shift1?.planningPcs && outputPerHour > 0
                              ? (
                                  Math.ceil(
                                    (shift1.planningPcs / outputPerHour) * 10,
                                  ) / 10
                                ).toFixed(1)
                              : "0.0";

                          const planningJamShift2 =
                            shift2?.planningPcs && outputPerHour > 0
                              ? (
                                  Math.ceil(
                                    (shift2.planningPcs / outputPerHour) * 10,
                                  ) / 10
                                ).toFixed(1)
                              : "0.0";

                          shift1Value = planningJamShift1;
                          shift2Value = planningJamShift2;
                          bgColor = "bg-yellow-900/30";
                          textColor = "text-yellow-300";
                          break;

                        case "planning-pcs":
                          shift1Value =
                            shift1?.planningPcs?.toLocaleString() || "0";
                          shift2Value =
                            shift2?.planningPcs?.toLocaleString() || "0";
                          bgColor = "bg-yellow-900/30";
                          textColor = "text-yellow-300";
                          break;

                        case "overtime-jam":
                          const overtimeJamShift1 =
                            shift1?.overtimePcs && outputPerHour > 0
                              ? (
                                  Math.ceil(
                                    (shift1.overtimePcs / outputPerHour) * 10,
                                  ) / 10
                                ).toFixed(1)
                              : "0.0";

                          const overtimeJamShift2 =
                            shift2?.overtimePcs && outputPerHour > 0
                              ? (
                                  Math.ceil(
                                    (shift2.overtimePcs / outputPerHour) * 10,
                                  ) / 10
                                ).toFixed(1)
                              : "0.0";

                          shift1Value = overtimeJamShift1;
                          shift2Value = overtimeJamShift2;
                          bgColor = "bg-orange-900/30";
                          textColor = "text-orange-300";
                          break;

                        case "overtime-pcs":
                          shift1Value =
                            shift1?.overtimePcs?.toLocaleString() || "0";
                          shift2Value =
                            shift2?.overtimePcs?.toLocaleString() || "0";
                          bgColor = "bg-orange-900/30";
                          textColor = "text-orange-300";
                          break;

                        case "jam-produksi":
                          const jamProduksiShift1 =
                            shift1?.pcs && outputPerHour > 0
                              ? (
                                  Math.ceil((shift1.pcs / outputPerHour) * 10) /
                                  10
                                ).toFixed(1)
                              : "0.0";

                          const jamProduksiShift2 =
                            shift2?.pcs && outputPerHour > 0
                              ? (
                                  Math.ceil((shift2.pcs / outputPerHour) * 10) /
                                  10
                                ).toFixed(1)
                              : "0.0";

                          shift1Value = jamProduksiShift1;
                          shift2Value = jamProduksiShift2;
                          bgColor = "bg-indigo-900/30";
                          textColor = "text-indigo-300";
                          break;

                        case "hasil-produksi":
                          shift1Value = shift1?.pcs?.toLocaleString() || "0";
                          shift2Value = shift2?.pcs?.toLocaleString() || "0";
                          bgColor = "bg-purple-900/30";
                          textColor = "text-purple-300";
                          break;

                        case "akumulasi-hasil":
                          // Calculate akumulasi hasil produksi
                          let akumulasiHasilShift1 = 0;
                          let akumulasiHasilShift2 = 0;

                          if (shift1) {
                            if (groupIndex === 0) {
                              akumulasiHasilShift1 = shift1.pcs || 0;
                            } else {
                              const prevGroup =
                                validGroupedRows[groupIndex - 1];
                              const prevShift2 = prevGroup.rows.find(
                                (r) => r.shift === "2",
                              );
                              const prevAkumulasi = prevShift2
                                ? prevShift2.akumulasiHasilProduksi || 0
                                : 0;
                              akumulasiHasilShift1 =
                                prevAkumulasi + (shift1.pcs || 0);
                            }
                            shift1.akumulasiHasilProduksi =
                              akumulasiHasilShift1;
                          }

                          if (shift2) {
                            akumulasiHasilShift2 =
                              akumulasiHasilShift1 + (shift2.pcs || 0);
                            shift2.akumulasiHasilProduksi =
                              akumulasiHasilShift2;
                          }

                          shift1Value = akumulasiHasilShift1.toLocaleString();
                          shift2Value = akumulasiHasilShift2.toLocaleString();
                          bgColor = "bg-purple-900/20";
                          textColor = "text-purple-200";
                          break;

                        case "jam-aktual":
                          shift1Value =
                            shift1?.jamProduksiAktual?.toFixed(1) || "0.0";
                          shift2Value =
                            shift2?.jamProduksiAktual?.toFixed(1) || "0.0";
                          bgColor = "bg-green-900/30";
                          textColor = "text-green-300";
                          break;

                        case "teori-stock":
                          // Calculate teori stock like in cards view
                          let teoriStockShift1 = 0;
                          let teoriStockShift2 = 0;

                          if (shift1) {
                            const shift1Calc = calculateOutputFields(
                              shift1,
                              flatRows.findIndex((r) => r.id === shift1.id),
                              flatRows,
                              timePerPcs,
                              initialStock,
                            );
                            const hasilProduksiShift1 = shift1.pcs || 0;
                            const delivery = shift1.delivery || 0;

                            if (groupIndex === 0) {
                              teoriStockShift1 =
                                initialStock + hasilProduksiShift1 - delivery;
                            } else {
                              const prevGroup =
                                validGroupedRows[groupIndex - 1];
                              const prevShift2 = prevGroup.rows.find(
                                (r) => r.shift === "2",
                              );
                              const prevTeoriStock =
                                prevShift2?.teoriStockCustom ?? initialStock;
                              teoriStockShift1 =
                                prevTeoriStock + hasilProduksiShift1 - delivery;
                            }
                            shift1.teoriStockCustom = teoriStockShift1;
                          }

                          if (shift2) {
                            const hasilProduksiShift2 = shift2.pcs || 0;
                            const delivery = shift2.delivery || 0;
                            const shift1Row = group.rows.find(
                              (r) => r.shift === "1",
                            );
                            const shift1TeoriStock =
                              shift1Row?.teoriStockCustom ?? initialStock;

                            teoriStockShift2 =
                              shift1TeoriStock + hasilProduksiShift2 - delivery;
                            shift2.teoriStockCustom = teoriStockShift2;
                          }

                          shift1Value = teoriStockShift1.toLocaleString();
                          shift2Value = teoriStockShift2.toLocaleString();
                          bgColor = "bg-teal-900/30";
                          textColor = "text-teal-300";
                          break;

                        case "actual-stock":
                          // Calculate actual stock like in cards view
                          let actualStockShift1 = 0;
                          let actualStockShift2 = 0;

                          if (shift1) {
                            const shift1Calc = calculateOutputFields(
                              shift1,
                              flatRows.findIndex((r) => r.id === shift1.id),
                              flatRows,
                              timePerPcs,
                              initialStock,
                            );
                            const hasilProduksi = shift1.pcs || 0;
                            const planningPcs = shift1.planningPcs || 0;
                            const overtimePcs = shift1.overtimePcs || 0;
                            const delivery = shift1.delivery || 0;

                            if (groupIndex === 0) {
                              actualStockShift1 =
                                hasilProduksi === 0
                                  ? initialStock +
                                    planningPcs +
                                    overtimePcs -
                                    delivery
                                  : initialStock + hasilProduksi - delivery;
                            } else {
                              const prevGroup =
                                validGroupedRows[groupIndex - 1];
                              const prevShift2 = prevGroup.rows.find(
                                (r) => r.shift === "2",
                              );
                              const prevActualStock =
                                prevShift2?.actualStockCustom ?? initialStock;
                              actualStockShift1 =
                                hasilProduksi === 0
                                  ? prevActualStock +
                                    planningPcs +
                                    overtimePcs -
                                    delivery
                                  : prevActualStock + hasilProduksi - delivery;
                            }
                            shift1.actualStockCustom = actualStockShift1;
                          }

                          if (shift2) {
                            const hasilProduksi = shift2.pcs || 0;
                            const planningPcs = shift2.planningPcs || 0;
                            const overtimePcs = shift2.overtimePcs || 0;
                            const delivery = shift2.delivery || 0;
                            const shift1Row = group.rows.find(
                              (r) => r.shift === "1",
                            );
                            const shift1ActualStock =
                              shift1Row?.actualStockCustom ?? initialStock;

                            actualStockShift2 =
                              hasilProduksi === 0
                                ? shift1ActualStock +
                                  planningPcs +
                                  overtimePcs -
                                  delivery
                                : shift1ActualStock + hasilProduksi - delivery;
                            shift2.actualStockCustom = actualStockShift2;
                          }

                          shift1Value = actualStockShift1.toLocaleString();
                          shift2Value = actualStockShift2.toLocaleString();
                          bgColor = "bg-emerald-900/30";
                          textColor = "text-emerald-300";
                          break;

                        case "rencana-stock":
                          // Calculate rencana stock like in cards view
                          let rencanaStockShift1 = 0;
                          let rencanaStockShift2 = 0;

                          if (shift1) {
                            const planningPcs = shift1.planningPcs || 0;
                            const overtimePcs = shift1.overtimePcs || 0;
                            const delivery = shift1.delivery || 0;

                            if (groupIndex === 0) {
                              rencanaStockShift1 =
                                initialStock +
                                planningPcs +
                                overtimePcs -
                                delivery;
                            } else {
                              const prevGroup =
                                validGroupedRows[groupIndex - 1];
                              const prevShift2 = prevGroup.rows.find(
                                (r) => r.shift === "2",
                              );
                              const prevRencanaStock =
                                prevShift2?.rencanaStockCustom ?? initialStock;
                              rencanaStockShift1 =
                                prevRencanaStock +
                                planningPcs +
                                overtimePcs -
                                delivery;
                            }
                            shift1.rencanaStockCustom = rencanaStockShift1;
                          }

                          if (shift2) {
                            const planningPcs = shift2.planningPcs || 0;
                            const overtimePcs = shift2.overtimePcs || 0;
                            const delivery = shift2.delivery || 0;
                            const shift1Row = group.rows.find(
                              (r) => r.shift === "1",
                            );
                            const shift1RencanaStock =
                              shift1Row?.rencanaStockCustom ?? initialStock;

                            rencanaStockShift2 =
                              shift1RencanaStock +
                              planningPcs +
                              overtimePcs -
                              delivery;
                            shift2.rencanaStockCustom = rencanaStockShift2;
                          }

                          shift1Value = rencanaStockShift1.toLocaleString();
                          shift2Value = rencanaStockShift2.toLocaleString();
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
                            {shift1Value}
                          </div>
                          <div
                            className={`${bgColor} text-center flex items-center justify-center ${textColor} font-mono text-sm font-semibold`}
                          >
                            {shift2Value}
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
