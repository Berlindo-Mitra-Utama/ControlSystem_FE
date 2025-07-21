import { ScheduleItem } from "../types/scheduleTypes";

export const calculateOutputFields = (
  row: ScheduleItem,
  index: number,
  allRows: ScheduleItem[],
  timePerPcs: number,
  initialStock: number,
) => {
  const planningHour = row.planningHour || 0;
  const overtimeHour = row.overtimeHour || 0;
  const delivery = row.delivery || 0;

  const akumulasiDelivery = allRows
    .slice(0, index)
    .reduce((sum, r) => sum + (r.delivery || 0), 0);
  const planningPcs =
    planningHour > 0 ? Math.floor((planningHour * 3600) / timePerPcs) : 0;
  const overtimePcs =
    overtimeHour > 0 ? Math.floor((overtimeHour * 3600) / timePerPcs) : 0;
  const hasilProduksi = planningPcs + overtimePcs;

  const akumulasiHasilProduksi =
    allRows.slice(0, index).reduce((sum, r) => {
      const rPlanningPcs = r.planningHour
        ? Math.floor((r.planningHour * 3600) / timePerPcs)
        : 0;
      const rOvertimePcs = r.overtimeHour
        ? Math.floor((r.overtimeHour * 3600) / timePerPcs)
        : 0;
      return sum + rPlanningPcs + rOvertimePcs;
    }, 0) + hasilProduksi;

  const jamProduksiCycleTime =
    hasilProduksi > 0 ? (hasilProduksi * timePerPcs) / 3600 : 0;
  const selisihDetikPerPcs =
    row.jamProduksiAktual && hasilProduksi > 0
      ? timePerPcs - (row.jamProduksiAktual * 3600) / hasilProduksi
      : 0;
  const selisihCycleTime = row.jamProduksiAktual
    ? jamProduksiCycleTime - row.jamProduksiAktual
    : 0;
  const selisihCycleTimePcs =
    selisihCycleTime > 0
      ? Math.floor((selisihCycleTime * 3600) / timePerPcs)
      : 0;

  const prevStock =
    index === 0 ? initialStock : allRows[index - 1].actualStock || initialStock;
  const teoriStock = prevStock + hasilProduksi;
  const actualStock = prevStock + hasilProduksi - delivery;

  return {
    akumulasiDelivery,
    planningPcs,
    overtimePcs,
    hasilProduksi,
    akumulasiHasilProduksi,
    jamProduksiCycleTime,
    selisihDetikPerPcs,
    selisihCycleTime,
    selisihCycleTimePcs,
    teoriStock,
    actualStock,
    prevStock,
  };
};

export const checkValidation = (
  row: ScheduleItem,
  calculated: any,
  timePerPcs: number,
) => {
  const alerts: string[] = [];
  if (
    calculated.actualStock >= (row.delivery || 0) &&
    (row.delivery || 0) > 0
  ) {
    alerts.push("Stok sudah cukup, tidak perlu produksi.");
  }
  const totalWaktuTersedia = (row.planningHour || 0) + (row.overtimeHour || 0);
  const waktuDibutuhkan =
    (((row.delivery || 0) - calculated.actualStock + calculated.hasilProduksi) *
      timePerPcs) /
    3600;
  if (totalWaktuTersedia < waktuDibutuhkan && waktuDibutuhkan > 0) {
    alerts.push(
      "Waktu produksi tidak cukup untuk memenuhi kebutuhan produksi.",
    );
  }
  return alerts;
};
