import React from "react";
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

const ScheduleTableView: React.FC<ScheduleTableViewProps> = ({
  validGroupedRows,
  flatRows,
  timePerPcs,
  initialStock,
  scheduleName,
}) => {
  // Calculate totals
  const totals = {
    delivery: flatRows.reduce((sum, row) => sum + (row.delivery || 0), 0),
    planningHour: flatRows.reduce(
      (sum, row) => sum + (row.planningHour || 0),
      0,
    ),
    overtimeHour: flatRows.reduce(
      (sum, row) => sum + (row.overtimeHour || 0),
      0,
    ),
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

  return (
    <div className="relative bg-slate-800/50 rounded-lg overflow-hidden">
      {/* Container with horizontal scroll */}
      <div className="flex">
        {/* Frozen Left Column - DESCRIPTION */}
        <div className="flex-shrink-0 bg-slate-700 border-r border-slate-600">
          {/* Header */}
          <div className="h-20 flex items-center justify-center bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600">
            <div className="text-white font-bold text-center px-4">
              DESCRIPTION
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-0">
            {[
              "STOCK (PCS)",
              "DELIVERY (PCS)",
              "AKUMULASI DELIVERY (PCS)",
              "PLANNING (JAM)",
              "OVERTIME (JAM)",
              "PLANNING (PCS)",
              "OVERTIME (PCS)",
              "JAM PRODUKSI (CYCLETIME)",
              "HASIL PRODUKSI (PCS)",
              "AKUMULASI HASIL PRODUKSI (PCS)",
              "JAM PRODUKSI AKTUAL",
              "THEORY STOCK (PCS)",
            ].map((label, index) => (
              <div
                key={index}
                className="h-12 flex items-center px-4 bg-slate-700 border-b border-slate-600 text-white font-semibold text-sm"
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* TOTAL Column */}
        <div className="flex-shrink-0 bg-slate-600 border-r border-slate-500 w-32">
          {/* Header */}
          <div className="h-20 flex items-center justify-center bg-gradient-to-r from-slate-700 to-slate-600 border-b border-slate-500">
            <div className="text-white font-bold text-center px-4">TOTAL</div>
          </div>

          {/* Total Rows */}
          <div className="space-y-0">
            {/* Stock Total - Not applicable */}
            <div className="h-12 flex items-center justify-center bg-slate-600 border-b border-slate-500 text-slate-400 font-mono text-xs">
              -
            </div>

            {/* Delivery Total */}
            <div className="h-12 flex items-center justify-center bg-cyan-800/50 border-b border-slate-500 text-cyan-200 font-mono text-xs font-bold">
              {totals.delivery.toLocaleString()}
            </div>

            {/* Akumulasi Delivery Total - Same as delivery total */}
            <div className="h-12 flex items-center justify-center bg-cyan-700/50 border-b border-slate-500 text-cyan-100 font-mono text-xs font-bold">
              {totals.delivery.toLocaleString()}
            </div>

            {/* Planning Hours Total */}
            <div className="h-12 flex items-center justify-center bg-yellow-800/50 border-b border-slate-500 text-yellow-200 font-mono text-xs font-bold">
              {totalPlanningJam}
            </div>

            {/* Overtime Hours Total */}
            <div className="h-12 flex items-center justify-center bg-orange-800/50 border-b border-slate-500 text-orange-200 font-mono text-xs font-bold">
              {totalOvertimeJam}
            </div>

            {/* Planning PCS Total */}
            <div className="h-12 flex items-center justify-center bg-yellow-800/50 border-b border-slate-500 text-yellow-200 font-mono text-xs font-bold">
              {totals.planningPcs.toLocaleString()}
            </div>

            {/* Overtime PCS Total */}
            <div className="h-12 flex items-center justify-center bg-orange-800/50 border-b border-slate-500 text-orange-200 font-mono text-xs font-bold">
              {totals.overtimePcs.toLocaleString()}
            </div>

            {/* Jam Produksi (Cycle Time) Total */}
            <div className="h-12 flex items-center justify-center bg-indigo-800/50 border-b border-slate-500 text-indigo-200 font-mono text-xs font-bold">
              {totalJamProduksi}
            </div>

            {/* Hasil Produksi Total */}
            <div className="h-12 flex items-center justify-center bg-purple-800/50 border-b border-slate-500 text-purple-200 font-mono text-xs font-bold">
              {totals.hasilProduksi.toLocaleString()}
            </div>

            {/* Akumulasi Hasil Produksi Total - Same as hasil produksi total */}
            <div className="h-12 flex items-center justify-center bg-purple-700/50 border-b border-slate-500 text-purple-100 font-mono text-xs font-bold">
              {totals.hasilProduksi.toLocaleString()}
            </div>

            {/* Jam Produksi Aktual Total */}
            <div className="h-12 flex items-center justify-center bg-green-800/50 border-b border-slate-500 text-green-200 font-mono text-xs font-bold">
              {totals.jamProduksiAktual.toFixed(1)}
            </div>

            {/* Theory Stock Total - Not applicable */}
            <div className="h-12 flex items-center justify-center bg-slate-600 border-b border-slate-500 text-slate-400 font-mono text-xs">
              -
            </div>
          </div>
        </div>

        {/* Scrollable Right Section - Date Columns */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex min-w-max">
            {validGroupedRows.map((group) => (
              <div
                key={group.day}
                className="flex-shrink-0 w-32 border-r border-slate-600"
              >
                {/* Date Header */}
                <div className="h-20 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600">
                  <div className="text-center p-2">
                    <div className="text-white font-bold">
                      {(() => {
                        const dateInfo = formatValidDate(
                          group.day,
                          scheduleName || "Februari 2025",
                        );
                        return (
                          <div>
                            <div className="text-xs">{dateInfo.dayName}</div>
                            <div className="text-lg font-bold">{group.day}</div>
                          </div>
                        );
                      })()}
                    </div>
                    {/* Shift Headers */}
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <div className="bg-blue-600/20 text-blue-300 text-xs py-1 rounded">
                        SHIFT 1
                      </div>
                      <div className="bg-purple-600/20 text-purple-300 text-xs py-1 rounded">
                        SHIFT 2
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Rows */}
                <div className="space-y-0">
                  {/* Stock Row */}
                  <div className="h-12 grid grid-cols-2 gap-1 border-b border-slate-600">
                    {(() => {
                      const shift1 = group.rows.find((r) => r.shift === "1");
                      const shift2 = group.rows.find((r) => r.shift === "2");

                      const shift1Calc = shift1
                        ? calculateOutputFields(
                            shift1,
                            flatRows.findIndex((r) => r.id === shift1.id),
                            flatRows,
                            timePerPcs,
                            initialStock,
                          )
                        : null;

                      const shift2Calc = shift2
                        ? calculateOutputFields(
                            shift2,
                            flatRows.findIndex((r) => r.id === shift2.id),
                            flatRows,
                            timePerPcs,
                            initialStock,
                          )
                        : null;

                      return (
                        <>
                          <div className="bg-slate-800 text-center flex items-center justify-center text-white font-mono text-xs">
                            {shift1Calc
                              ? shift1Calc.prevStock.toLocaleString()
                              : "-"}
                          </div>
                          <div className="bg-slate-800 text-center flex items-center justify-center text-white font-mono text-xs">
                            {shift2Calc
                              ? shift2Calc.prevStock.toLocaleString()
                              : "-"}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Delivery Row */}
                  <div className="h-12 grid grid-cols-2 gap-1 border-b border-slate-600">
                    {(() => {
                      const shift1 = group.rows.find((r) => r.shift === "1");
                      const shift2 = group.rows.find((r) => r.shift === "2");

                      return (
                        <>
                          <div className="bg-cyan-900/30 text-center flex items-center justify-center text-cyan-300 font-mono text-xs">
                            {shift1?.delivery?.toLocaleString() || "0"}
                          </div>
                          <div className="bg-cyan-900/30 text-center flex items-center justify-center text-cyan-300 font-mono text-xs">
                            {shift2?.delivery?.toLocaleString() || "0"}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Akumulasi Delivery Row */}
                  <div className="h-12 grid grid-cols-2 gap-1 border-b border-slate-600">
                    {(() => {
                      const shift1 = group.rows.find((r) => r.shift === "1");
                      const shift2 = group.rows.find((r) => r.shift === "2");
                      const groupIndex = validGroupedRows.findIndex(
                        (g) => g.day === group.day,
                      );

                      // Calculate akumulasi delivery
                      let akumulasiShift1 = 0;
                      let akumulasiShift2 = 0;

                      if (shift1) {
                        if (groupIndex === 0) {
                          akumulasiShift1 = shift1.delivery || 0;
                        } else {
                          const prevGroup = validGroupedRows[groupIndex - 1];
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

                      return (
                        <>
                          <div className="bg-cyan-900/20 text-center flex items-center justify-center text-cyan-200 font-mono text-xs">
                            {akumulasiShift1.toLocaleString()}
                          </div>
                          <div className="bg-cyan-900/20 text-center flex items-center justify-center text-cyan-200 font-mono text-xs">
                            {akumulasiShift2.toLocaleString()}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Planning Hours Row */}
                  <div className="h-12 grid grid-cols-2 gap-1 border-b border-slate-600">
                    {(() => {
                      const shift1 = group.rows.find((r) => r.shift === "1");
                      const shift2 = group.rows.find((r) => r.shift === "2");

                      const outputPerHour =
                        timePerPcs > 0 ? Math.floor(3600 / timePerPcs) : 0;

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

                      return (
                        <>
                          <div className="bg-yellow-900/30 text-center flex items-center justify-center text-yellow-300 font-mono text-xs">
                            {planningJamShift1}
                          </div>
                          <div className="bg-yellow-900/30 text-center flex items-center justify-center text-yellow-300 font-mono text-xs">
                            {planningJamShift2}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Overtime Hours Row */}
                  <div className="h-12 grid grid-cols-2 gap-1 border-b border-slate-600">
                    {(() => {
                      const shift1 = group.rows.find((r) => r.shift === "1");
                      const shift2 = group.rows.find((r) => r.shift === "2");

                      const outputPerHour =
                        timePerPcs > 0 ? Math.floor(3600 / timePerPcs) : 0;

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

                      return (
                        <>
                          <div className="bg-orange-900/30 text-center flex items-center justify-center text-orange-300 font-mono text-xs">
                            {overtimeJamShift1}
                          </div>
                          <div className="bg-orange-900/30 text-center flex items-center justify-center text-orange-300 font-mono text-xs">
                            {overtimeJamShift2}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Planning PCS Row */}
                  <div className="h-12 grid grid-cols-2 gap-1 border-b border-slate-600">
                    {(() => {
                      const shift1 = group.rows.find((r) => r.shift === "1");
                      const shift2 = group.rows.find((r) => r.shift === "2");

                      return (
                        <>
                          <div className="bg-yellow-900/30 text-center flex items-center justify-center text-yellow-300 font-mono text-xs">
                            {shift1?.planningPcs?.toLocaleString() || "0"}
                          </div>
                          <div className="bg-yellow-900/30 text-center flex items-center justify-center text-yellow-300 font-mono text-xs">
                            {shift2?.planningPcs?.toLocaleString() || "0"}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Overtime PCS Row */}
                  <div className="h-12 grid grid-cols-2 gap-1 border-b border-slate-600">
                    {(() => {
                      const shift1 = group.rows.find((r) => r.shift === "1");
                      const shift2 = group.rows.find((r) => r.shift === "2");

                      return (
                        <>
                          <div className="bg-orange-900/30 text-center flex items-center justify-center text-orange-300 font-mono text-xs">
                            {shift1?.overtimePcs?.toLocaleString() || "0"}
                          </div>
                          <div className="bg-orange-900/30 text-center flex items-center justify-center text-orange-300 font-mono text-xs">
                            {shift2?.overtimePcs?.toLocaleString() || "0"}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Jam Produksi (Cycle Time) Row */}
                  <div className="h-12 grid grid-cols-2 gap-1 border-b border-slate-600">
                    {(() => {
                      const shift1 = group.rows.find((r) => r.shift === "1");
                      const shift2 = group.rows.find((r) => r.shift === "2");

                      const outputPerHour =
                        timePerPcs > 0 ? Math.floor(3600 / timePerPcs) : 0;

                      const jamProduksiShift1 =
                        shift1?.pcs && outputPerHour > 0
                          ? (
                              Math.ceil((shift1.pcs / outputPerHour) * 10) / 10
                            ).toFixed(1)
                          : "0.0";

                      const jamProduksiShift2 =
                        shift2?.pcs && outputPerHour > 0
                          ? (
                              Math.ceil((shift2.pcs / outputPerHour) * 10) / 10
                            ).toFixed(1)
                          : "0.0";

                      return (
                        <>
                          <div className="bg-indigo-900/30 text-center flex items-center justify-center text-indigo-300 font-mono text-xs">
                            {jamProduksiShift1}
                          </div>
                          <div className="bg-indigo-900/30 text-center flex items-center justify-center text-indigo-300 font-mono text-xs">
                            {jamProduksiShift2}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Hasil Produksi Row */}
                  <div className="h-12 grid grid-cols-2 gap-1 border-b border-slate-600">
                    {(() => {
                      const shift1 = group.rows.find((r) => r.shift === "1");
                      const shift2 = group.rows.find((r) => r.shift === "2");

                      return (
                        <>
                          <div className="bg-purple-900/30 text-center flex items-center justify-center text-purple-300 font-mono text-xs">
                            {shift1?.pcs?.toLocaleString() || "0"}
                          </div>
                          <div className="bg-purple-900/30 text-center flex items-center justify-center text-purple-300 font-mono text-xs">
                            {shift2?.pcs?.toLocaleString() || "0"}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Akumulasi Hasil Produksi Row */}
                  <div className="h-12 grid grid-cols-2 gap-1 border-b border-slate-600">
                    {(() => {
                      const shift1 = group.rows.find((r) => r.shift === "1");
                      const shift2 = group.rows.find((r) => r.shift === "2");
                      const groupIndex = validGroupedRows.findIndex(
                        (g) => g.day === group.day,
                      );

                      // Calculate akumulasi hasil produksi
                      let akumulasiHasilShift1 = 0;
                      let akumulasiHasilShift2 = 0;

                      if (shift1) {
                        if (groupIndex === 0) {
                          akumulasiHasilShift1 = shift1.pcs || 0;
                        } else {
                          const prevGroup = validGroupedRows[groupIndex - 1];
                          const prevShift2 = prevGroup.rows.find(
                            (r) => r.shift === "2",
                          );
                          const prevAkumulasi = prevShift2
                            ? prevShift2.akumulasiHasilProduksi || 0
                            : 0;
                          akumulasiHasilShift1 =
                            prevAkumulasi + (shift1.pcs || 0);
                        }
                        shift1.akumulasiHasilProduksi = akumulasiHasilShift1;
                      }

                      if (shift2) {
                        akumulasiHasilShift2 =
                          akumulasiHasilShift1 + (shift2.pcs || 0);
                        shift2.akumulasiHasilProduksi = akumulasiHasilShift2;
                      }

                      return (
                        <>
                          <div className="bg-purple-900/20 text-center flex items-center justify-center text-purple-200 font-mono text-xs">
                            {akumulasiHasilShift1.toLocaleString()}
                          </div>
                          <div className="bg-purple-900/20 text-center flex items-center justify-center text-purple-200 font-mono text-xs">
                            {akumulasiHasilShift2.toLocaleString()}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Jam Produksi Aktual Row */}
                  <div className="h-12 grid grid-cols-2 gap-1 border-b border-slate-600">
                    {(() => {
                      const shift1 = group.rows.find((r) => r.shift === "1");
                      const shift2 = group.rows.find((r) => r.shift === "2");

                      return (
                        <>
                          <div className="bg-green-900/30 text-center flex items-center justify-center text-green-300 font-mono text-xs">
                            {shift1?.jamProduksiAktual?.toFixed(1) || "0.0"}
                          </div>
                          <div className="bg-green-900/30 text-center flex items-center justify-center text-green-300 font-mono text-xs">
                            {shift2?.jamProduksiAktual?.toFixed(1) || "0.0"}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Theory Stock Row */}
                  <div className="h-12 grid grid-cols-2 gap-1 border-b border-slate-600">
                    {(() => {
                      const shift1 = group.rows.find((r) => r.shift === "1");
                      const shift2 = group.rows.find((r) => r.shift === "2");

                      const shift1Calc = shift1
                        ? calculateOutputFields(
                            shift1,
                            flatRows.findIndex((r) => r.id === shift1.id),
                            flatRows,
                            timePerPcs,
                            initialStock,
                          )
                        : null;

                      const shift2Calc = shift2
                        ? calculateOutputFields(
                            shift2,
                            flatRows.findIndex((r) => r.id === shift2.id),
                            flatRows,
                            timePerPcs,
                            initialStock,
                          )
                        : null;

                      return (
                        <>
                          <div className="bg-emerald-900/30 text-center flex items-center justify-center text-emerald-300 font-mono text-xs">
                            {shift1Calc
                              ? shift1Calc.actualStock.toLocaleString()
                              : "0"}
                          </div>
                          <div className="bg-emerald-900/30 text-center flex items-center justify-center text-emerald-300 font-mono text-xs">
                            {shift2Calc
                              ? shift2Calc.actualStock.toLocaleString()
                              : "0"}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTableView;
