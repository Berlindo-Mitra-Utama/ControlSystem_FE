// Utils untuk mengelola logika data baris pada ScheduleTableView

import { ScheduleItem } from "../../types/scheduleTypes";
import {
  calculateAkumulasiDelivery,
  calculateAkumulasiHasilProduksi,
  calculateStockCustom,
  formatJamProduksi,
  formatNumber,
  formatNumberWithDecimal,
} from "./scheduleCalcUtils";

export interface RowDataConfig {
  shift1Value: string | number;
  shift2Value: string | number;
  isEditable: boolean;
  shift1Field: string;
  shift2Field: string;
}

// Default manpower count dan pcs per manpower
const DEFAULT_MANPOWER_COUNT = 3;
const PCS_PER_MANPOWER = 14 / 3; // 4.666 pcs per manpower

export const getRowDataConfig = (
  rowKey: string,
  shift1: ScheduleItem | undefined,
  shift2: ScheduleItem | undefined,
  group: { day: number; rows: ScheduleItem[] },
  validGroupedRows: { day: number; rows: ScheduleItem[] }[],
  groupIndex: number,
  initialStock: number,
  manpowerList: { id: number; name: string }[],
  flatRows: ScheduleItem[],
): RowDataConfig => {
  let shift1Value: string | number = "-";
  let shift2Value: string | number = "-";
  let isEditable = false;
  let shift1Field = "";
  let shift2Field = "";

  switch (rowKey) {
    case "manpower":
      shift1Value = getManpowerDisplayValue(shift1, manpowerList);
      shift2Value = getManpowerDisplayValue(shift2, manpowerList);
      isEditable = true;
      shift1Field = "manpower";
      shift2Field = "manpower";
      break;

    case "delivery":
      shift1Value = shift1?.delivery || 0;
      shift2Value = shift2?.delivery || 0;
      isEditable = true;
      shift1Field = "delivery";
      shift2Field = "delivery";
      break;

    case "akumulasi-delivery":
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
      break;

    case "planning-jam":
      const planningJamValues = calculatePlanningJam(
        shift1,
        shift2,
        DEFAULT_MANPOWER_COUNT,
        PCS_PER_MANPOWER,
      );
      shift1Value = planningJamValues.shift1;
      shift2Value = planningJamValues.shift2;
      break;

    case "planning-pcs":
      shift1Value = shift1?.planningPcs || 0;
      shift2Value = shift2?.planningPcs || 0;
      isEditable = true;
      shift1Field = "planningPcs";
      shift2Field = "planningPcs";
      break;

    case "overtime-jam":
      const overtimeJamValues = calculateOvertimeJam(
        shift1,
        shift2,
        DEFAULT_MANPOWER_COUNT,
        PCS_PER_MANPOWER,
      );
      shift1Value = overtimeJamValues.shift1;
      shift2Value = overtimeJamValues.shift2;
      break;

    case "overtime-pcs":
      shift1Value = shift1?.overtimePcs || 0;
      shift2Value = shift2?.overtimePcs || 0;
      isEditable = true;
      shift1Field = "overtimePcs";
      shift2Field = "overtimePcs";
      break;

    case "jam-produksi":
      const jamProduksiValues = calculateJamProduksi(
        shift1,
        shift2,
        DEFAULT_MANPOWER_COUNT,
        PCS_PER_MANPOWER,
      );
      shift1Value = jamProduksiValues.shift1;
      shift2Value = jamProduksiValues.shift2;
      break;

    case "hasil-produksi":
      shift1Value = shift1?.pcs || 0;
      shift2Value = shift2?.pcs || 0;
      isEditable = true;
      shift1Field = "pcs";
      shift2Field = "pcs";
      break;

    case "akumulasi-hasil":
      const akumulasiHasil = calculateAkumulasiHasilProduksi(
        group.day,
        validGroupedRows,
        groupIndex,
      );

      if (shift1) {
        shift1.akumulasiHasilProduksi = akumulasiHasil.shift1;
      }
      if (shift2) {
        shift2.akumulasiHasilProduksi = akumulasiHasil.shift2;
      }

      shift1Value = formatNumber(akumulasiHasil.shift1);
      shift2Value = formatNumber(akumulasiHasil.shift2);
      break;

    case "jam-aktual":
      shift1Value = formatNumberWithDecimal(shift1?.jamProduksiAktual || 0);
      shift2Value = formatNumberWithDecimal(shift2?.jamProduksiAktual || 0);
      isEditable = true;
      shift1Field = "jamProduksiAktual";
      shift2Field = "jamProduksiAktual";
      break;

    case "actual-stock":
      const actualStockValues = calculateActualStock(
        shift1,
        shift2,
        group,
        validGroupedRows,
        groupIndex,
        initialStock,
      );
      shift1Value = actualStockValues.shift1;
      shift2Value = actualStockValues.shift2;
      break;

    case "rencana-stock":
      const rencanaStockValues = calculateRencanaStock(
        shift1,
        shift2,
        group,
        validGroupedRows,
        groupIndex,
        initialStock,
      );
      shift1Value = rencanaStockValues.shift1;
      shift2Value = rencanaStockValues.shift2;
      break;
  }

  return {
    shift1Value,
    shift2Value,
    isEditable,
    shift1Field,
    shift2Field,
  };
};

// Helper functions
function getManpowerDisplayValue(
  shift: ScheduleItem | undefined,
  manpowerList: { id: number; name: string }[],
): string {
  if (!shift?.manpowerIds || shift.manpowerIds.length === 0) {
    return "Pilih";
  }

  const manpowerNames = shift.manpowerIds
    .map((id) => {
      const mp = manpowerList.find((mp) => mp.id === id);
      return mp ? mp.name : null;
    })
    .filter(Boolean);

  return manpowerNames.join(", ");
}

function calculatePlanningJam(
  shift1: ScheduleItem | undefined,
  shift2: ScheduleItem | undefined,
  defaultManpowerCount: number,
  pcsPerManpower: number,
) {
  const shift1ManpowerCount =
    shift1?.manpowerIds?.length || defaultManpowerCount;
  const shift2ManpowerCount =
    shift2?.manpowerIds?.length || defaultManpowerCount;

  const shift1OutputPerHour = shift1ManpowerCount * pcsPerManpower;
  const shift2OutputPerHour = shift2ManpowerCount * pcsPerManpower;

  const planningProduksiJamShift1 = formatJamProduksi(
    shift1?.planningPcs || 0,
    shift1OutputPerHour,
  );

  const planningProduksiJamShift2 = formatJamProduksi(
    shift2?.planningPcs || 0,
    shift2OutputPerHour,
  );

  return {
    shift1: planningProduksiJamShift1,
    shift2: planningProduksiJamShift2,
  };
}

function calculateOvertimeJam(
  shift1: ScheduleItem | undefined,
  shift2: ScheduleItem | undefined,
  defaultManpowerCount: number,
  pcsPerManpower: number,
) {
  const overtimeShift1ManpowerCount =
    shift1?.manpowerIds?.length || defaultManpowerCount;
  const overtimeShift2ManpowerCount =
    shift2?.manpowerIds?.length || defaultManpowerCount;

  const overtimeShift1OutputPerHour =
    overtimeShift1ManpowerCount * pcsPerManpower;
  const overtimeShift2OutputPerHour =
    overtimeShift2ManpowerCount * pcsPerManpower;

  const overtimeJamShift1 = formatJamProduksi(
    shift1?.overtimePcs || 0,
    overtimeShift1OutputPerHour,
  );

  const overtimeJamShift2 = formatJamProduksi(
    shift2?.overtimePcs || 0,
    overtimeShift2OutputPerHour,
  );

  return {
    shift1: overtimeJamShift1,
    shift2: overtimeJamShift2,
  };
}

function calculateJamProduksi(
  shift1: ScheduleItem | undefined,
  shift2: ScheduleItem | undefined,
  defaultManpowerCount: number,
  pcsPerManpower: number,
) {
  const jamProduksiShift1ManpowerCount =
    shift1?.manpowerIds?.length || defaultManpowerCount;
  const jamProduksiShift2ManpowerCount =
    shift2?.manpowerIds?.length || defaultManpowerCount;

  const jamProduksiShift1OutputPerHour =
    jamProduksiShift1ManpowerCount * pcsPerManpower;
  const jamProduksiShift2OutputPerHour =
    jamProduksiShift2ManpowerCount * pcsPerManpower;

  const jamProduksiShift1 = formatJamProduksi(
    shift1?.pcs || 0,
    jamProduksiShift1OutputPerHour,
  );

  const jamProduksiShift2 = formatJamProduksi(
    shift2?.pcs || 0,
    jamProduksiShift2OutputPerHour,
  );

  return {
    shift1: jamProduksiShift1,
    shift2: jamProduksiShift2,
  };
}

function calculateActualStock(
  shift1: ScheduleItem | undefined,
  shift2: ScheduleItem | undefined,
  group: { day: number; rows: ScheduleItem[] },
  validGroupedRows: { day: number; rows: ScheduleItem[] }[],
  groupIndex: number,
  initialStock: number,
) {
  let shift1Value = "-";
  let shift2Value = "-";

  if (shift1) {
    const stockCustom1 = calculateStockCustom(
      shift1,
      group,
      validGroupedRows,
      groupIndex,
      initialStock,
    );
    shift1.actualStockCustom = stockCustom1.actualStock;
    shift1Value = formatNumber(stockCustom1.actualStock);
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
    shift2Value = formatNumber(stockCustom2.actualStock);
  }

  return {
    shift1: shift1Value,
    shift2: shift2Value,
  };
}

function calculateRencanaStock(
  shift1: ScheduleItem | undefined,
  shift2: ScheduleItem | undefined,
  group: { day: number; rows: ScheduleItem[] },
  validGroupedRows: { day: number; rows: ScheduleItem[] }[],
  groupIndex: number,
  initialStock: number,
) {
  let shift1Value = "-";
  let shift2Value = "-";

  if (shift1) {
    const stockCustom1 = calculateStockCustom(
      shift1,
      group,
      validGroupedRows,
      groupIndex,
      initialStock,
    );
    shift1.rencanaStockCustom = stockCustom1.rencanaStock;
    shift1Value = formatNumber(stockCustom1.rencanaStock);
  }

  if (shift2) {
    const stockCustom2 = calculateStockCustom(
      shift2,
      group,
      validGroupedRows,
      groupIndex,
      initialStock,
    );
    shift2.rencanaStockCustom = stockCustom2.rencanaStock;
    shift2Value = formatNumber(stockCustom2.rencanaStock);
  }

  return {
    shift1: shift1Value,
    shift2: shift2Value,
  };
}
