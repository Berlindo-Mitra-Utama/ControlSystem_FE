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

// Fungsi untuk memproses data schedule untuk table view
export const prepareTableViewData = (
  schedule: ScheduleItem[],
  searchDate: string,
  scheduleName?: string,
) => {
  // Filter schedule berdasarkan search box (if any)
  const filteredSchedule = searchDate
    ? schedule.filter((row) => row.day.toString().includes(searchDate.trim()))
    : schedule;

  // Group data berdasarkan hari
  const groupedRows: { day: number; rows: typeof filteredSchedule }[] = [];
  filteredSchedule.forEach((row) => {
    const lastGroup = groupedRows[groupedRows.length - 1];
    if (lastGroup && lastGroup.day === row.day) {
      lastGroup.rows.push(row);
    } else {
      groupedRows.push({ day: row.day, rows: [row] });
    }
  });

  // Filter groupedRows berdasarkan hari valid dalam bulan
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  let monthIndex = -1;
  let year = new Date().getFullYear();

  // Cari bulan dalam scheduleName
  for (let i = 0; i < months.length; i++) {
    if (scheduleName?.includes(months[i])) {
      monthIndex = i;
      break;
    }
  }

  // Extract tahun menggunakan regex
  const yearMatch = scheduleName?.match(/(\d{4})/);
  if (yearMatch && yearMatch[1]) {
    year = parseInt(yearMatch[1]);
  }

  // Jika bulan tidak ditemukan, gunakan default
  if (monthIndex === -1) {
    monthIndex = 6; // Juli sebagai default
    year = 2025;
  }

  const maxDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const validGroupedRows = groupedRows.filter(
    (group) => group.day >= 1 && group.day <= maxDaysInMonth,
  );

  const flatRows = validGroupedRows.flatMap((g) => g.rows);

  return { validGroupedRows, flatRows };
};

// Fungsi untuk kalkulasi output berdasarkan manpower
export const calculateEffectiveTimePerPcs = (
  timePerPcs: number,
  manPowers: string[],
): number => {
  return timePerPcs > 0 && manPowers.length > 0
    ? 3600 / (manPowers.length * 5)
    : timePerPcs;
};

// Fungsi untuk kalkulasi output per jam
export const calculateOutputPerHour = (
  timePerPcs: number,
  manPowers: string[],
): number => {
  if (manPowers.length > 0) {
    return manPowers.length * 5;
  }
  return timePerPcs > 0 ? Math.floor(3600 / timePerPcs) : 0;
};

// Fungsi untuk kalkulasi output berdasarkan jam kerja
export const calculateOutputByHours = (
  hours: number,
  timePerPcs: number,
  manPowers: string[],
): number => {
  if (manPowers.length > 0) {
    return manPowers.length * 5 * hours;
  }
  return timePerPcs > 0 ? Math.floor((3600 * hours) / timePerPcs) : 0;
};

// Fungsi untuk generate schedule berdasarkan form data
export const generateScheduleFromForm = (
  form: any,
  prevSchedule: ScheduleItem[] = [],
): ScheduleItem[] => {
  // Save previous delivery values if possible
  const prevDeliveryMap = new Map<string, number | undefined>();
  prevSchedule.forEach((item) => {
    prevDeliveryMap.set(item.id, item.delivery);
  });

  // Parameter produksi
  const waktuKerjaShift = 7; // jam kerja per shift
  let timePerPcs = form.timePerPcs;
  let manpowerCount = Array.isArray(form.manpowers)
    ? form.manpowers.filter((mp) => mp.trim() !== "").length
    : 1;
  if (manpowerCount < 1) manpowerCount = 1;

  // Koreksi: waktu produksi per shift = 7 jam, kapasitas produksi per shift = (7*3600) / (timePerPcs/manpowerCount)
  const kapasitasShift =
    timePerPcs > 0 && manpowerCount > 0
      ? Math.floor((waktuKerjaShift * 3600) / (timePerPcs / manpowerCount))
      : 0;
  let sisaStock = form.stock;
  let shortfall = 0;
  let overtimeRows: ScheduleItem[] = [];
  const scheduleList: ScheduleItem[] = [];

  // Simulasi 30 hari produksi
  for (let d = 1; d <= 30; d++) {
    // Delivery per hari (bisa diisi user, default 0, atau ambil dari prevDeliveryMap shift 1)
    const idShift1 = `${d}-1`;
    let deliveryShift1 = prevDeliveryMap.get(idShift1) ?? 0;
    // Shift 2 tidak ada delivery
    // Total delivery hari ini
    let totalDelivery = deliveryShift1;
    // Bagi delivery ke 2 shift
    let planningHariIni = Math.min(totalDelivery, sisaStock);
    let planningShift1 = Math.min(
      Math.floor(planningHariIni / 2),
      kapasitasShift,
      sisaStock,
    );
    sisaStock -= planningShift1;
    let planningShift2 = Math.min(
      planningHariIni - planningShift1,
      kapasitasShift,
      sisaStock,
    );
    sisaStock -= planningShift2;
    // Jika delivery > total produksi hari ini, shortfall
    let shortfallHariIni = totalDelivery - (planningShift1 + planningShift2);
    if (shortfallHariIni > 0) {
      shortfall += shortfallHariIni;
    }
    // Row shift 1
    scheduleList.push({
      id: idShift1,
      day: d,
      shift: "1",
      type: "Produksi",
      pcs: planningShift1,
      time: "07:00-15:00",
      status: "Normal",
      delivery: deliveryShift1,
      planningPcs: planningShift1,
      overtimePcs: 0,
      notes: "",
    });
    // Row shift 2
    scheduleList.push({
      id: `${d}-2`,
      day: d,
      shift: "2",
      type: "Produksi",
      pcs: planningShift2,
      time: "15:00-23:00",
      status: "Normal",
      delivery: undefined,
      planningPcs: planningShift2,
      overtimePcs: 0,
      notes: "",
    });
    // Setiap 3 hari, shortfall dijadwalkan sebagai lembur 2 hari kemudian
    if (d % 3 === 0 && shortfall > 0) {
      const lemburDay = d + 2;
      if (lemburDay <= 30) {
        overtimeRows.push({
          id: `${lemburDay}-OT`,
          day: lemburDay,
          shift: "-",
          type: "Lembur",
          pcs: shortfall,
          time: "-",
          status: "Normal",
          delivery: undefined,
          planningPcs: 0,
          overtimePcs: shortfall,
          notes: `Lembur dari shortfall hari ${d - 2} s/d ${d}`,
        });
        sisaStock -= shortfall;
      }
      shortfall = 0;
    }
  }
  // Gabungkan lembur ke schedule utama, urutkan berdasarkan hari
  const allRows = [...scheduleList, ...overtimeRows];
  allRows.sort(
    (a, b) => a.day - b.day || (a.shift || "").localeCompare(b.shift || ""),
  );
  return allRows;
};

// Fungsi untuk recalculate schedule dengan perubahan
export const recalculateScheduleWithChanges = (
  updatedSchedule: ScheduleItem[],
  form: any,
  editingRow: string | null,
  editForm: Partial<ScheduleItem>,
): ScheduleItem[] => {
  const { timePerPcs } = form;
  let totalDisrupted = 0;

  const processedSchedule = updatedSchedule.map((item) => {
    if (item.status === "Gangguan") {
      const disrupted = item.pcs - (item.actualPcs || 0);
      totalDisrupted += disrupted;
      return item;
    }
    return item;
  });

  if (totalDisrupted <= 0) {
    return updatedSchedule;
  }

  const existingOvertimeIndex = processedSchedule.findIndex(
    (item) => item.day === 31 && item.type === "Lembur",
  );

  if (existingOvertimeIndex >= 0) {
    const updatedProcessedSchedule = [...processedSchedule];
    const existingOvertime = updatedProcessedSchedule[existingOvertimeIndex];
    const newPcs = existingOvertime.pcs + totalDisrupted;
    const newTime = ((newPcs * timePerPcs) / 60).toFixed(2);

    updatedProcessedSchedule[existingOvertimeIndex] = {
      ...existingOvertime,
      pcs: newPcs,
      actualPcs: newPcs,
      time: newTime,
      notes: "Lembur untuk memenuhi target produksi dan kompensasi gangguan",
    };

    return updatedProcessedSchedule;
  } else {
    const overtimeSeconds = totalDisrupted * timePerPcs;
    const overtimeMinutes = overtimeSeconds / 60;

    const overtimeSchedule: ScheduleItem = {
      id: `31-1`,
      day: 31,
      shift: "1",
      type: "Lembur",
      pcs: totalDisrupted,
      time: overtimeMinutes.toFixed(2),
      status: "Normal",
      actualPcs: totalDisrupted,
      notes: "Kompensasi gangguan produksi",
    };

    return [...processedSchedule, overtimeSchedule];
  }
};

// Fungsi untuk mempersiapkan data Excel
export const prepareExcelData = (
  flatRows: ScheduleItem[],
  timePerPcs: number,
  initialStock: number,
) => {
  return flatRows.map((item, index) => {
    const calculated = calculateOutputFields(
      item,
      index,
      flatRows,
      timePerPcs,
      initialStock,
    );
    return {
      No: index + 1,
      Hari: item.day,
      Shift: item.shift,
      Waktu: item.shift === "1" ? "07:30-16:30" : "19:30-04:30",
      Status: item.status,
      "Stok Awal": calculated.prevStock,
      Delivery: item.delivery || 0,
      "Planning Hour": item.planningHour || 0,
      "Overtime Hour": item.overtimeHour || 0,
      "Planning PCS": calculated.planningPcs,
      "Overtime PCS": calculated.overtimePcs,
      "Hasil Produksi": calculated.hasilProduksi,
      "Actual Stock": calculated.actualStock,
      "Jam Produksi Aktual": item.jamProduksiAktual || 0,
      Catatan: item.notes || "",
    };
  });
};

// Fungsi untuk update calculated fields berdasarkan form
export const updateCalculatedFields = (form: any) => {
  const { timePerPcs, planningHour, overtimeHour, isManualPlanningPcs } = form;

  if (timePerPcs > 0) {
    const cycle1 = timePerPcs;
    const cycle7 = timePerPcs * 7;
    const cycle35 = timePerPcs * 3.5;

    const planningPcs = isManualPlanningPcs
      ? form.planningPcs
      : Math.floor((planningHour * 3600) / timePerPcs);
    const overtimePcs = Math.floor((overtimeHour * 3600) / timePerPcs);

    return {
      cycle1,
      cycle7,
      cycle35,
      planningPcs,
      overtimePcs,
    };
  }
  return form;
};

// Fungsi untuk handle form change
export const handleFormChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  form: any,
  setForm: (form: any) => void,
) => {
  const { name, value } = e.target as any;

  // Tangani field non-numerik khusus
  if (name === "partImage" || name === "partImageUrl") {
    setForm((prev: any) => ({
      ...prev,
      [name]: value,
    }));
    return;
  }
  const numericValue = Number.parseFloat(value);

  if (name === "manpowers") return;
  if (numericValue < 0 && !isNaN(numericValue)) return;

  if (name === "planningPcs") {
    setForm((prev: any) => ({
      ...prev,
      [name]: numericValue || 0,
      isManualPlanningPcs: true,
    }));
  } else if (["cycle1", "cycle7", "cycle35"].includes(name)) {
    setForm((prev: any) => ({
      ...prev,
      [name]: numericValue || 0,
      isManualPlanningPcs: true,
    }));
    if (name === "cycle1" && numericValue > 0) {
      setForm((prev: any) => ({
        ...prev,
        timePerPcs: numericValue,
      }));
    }
    if (
      name === "timePerPcs" &&
      numericValue > 0 &&
      !form.isManualPlanningPcs
    ) {
      setForm((prev: any) => ({
        ...prev,
        cycle1: numericValue,
        cycle7: numericValue * 7,
        cycle35: numericValue * 3.5,
      }));
    }
  } else {
    setForm((prev: any) => ({
      ...prev,
      [name]: ["part", "customer", "processes"].includes(name)
        ? value
        : numericValue || 0,
    }));
  }
};

// Fungsi untuk handle part selection
export const handlePartSelection = (
  e: React.ChangeEvent<HTMLSelectElement>,
  mockData: any[],
  setForm: (form: any) => void,
) => {
  const selected = mockData.find((item) => item.part === e.target.value);
  if (selected) {
    setForm((prev: any) => ({
      ...prev,
      part: selected.part,
      customer: selected.customer,
      timePerPcs: selected.timePerPcs,
      cycle1: selected.cycle1,
      cycle7: selected.cycle7,
      cycle35: selected.cycle35,
      isManualPlanningPcs: false,
    }));
  } else {
    setForm((prev: any) => ({
      ...prev,
      part: e.target.value,
      customer: "",
      timePerPcs: prev.timePerPcs > 0 ? prev.timePerPcs : 0,
      cycle1: 0,
      cycle7: 0,
      cycle35: 0,
      isManualPlanningPcs: true,
    }));
  }
};

// Fungsi untuk reset form dan schedule
export const resetFormAndSchedule = (
  setForm: (form: any) => void,
  setSchedule: (schedule: ScheduleItem[]) => void,
  setSelectedMonth: (month: number) => void,
  setSelectedYear: (year: number) => void,
) => {
  setForm({
    part: "",
    customer: "",
    timePerPcs: 257,
    cycle1: 0,
    cycle7: 0,
    cycle35: 0,
    stock: 332,
    planningHour: 274,
    overtimeHour: 119,
    planningPcs: 3838,
    overtimePcs: 1672,
    isManualPlanningPcs: false,
    manpowers: [],
  });
  setSchedule([]);
  setSelectedMonth(new Date().getMonth());
  setSelectedYear(new Date().getFullYear());
};

// Fungsi untuk menghitung totals dari schedule
export const calculateScheduleTotals = (flatRows: ScheduleItem[]) => {
  return {
    delivery: flatRows.reduce((sum, row) => sum + (row.delivery || 0), 0),
    planningPcs: flatRows.reduce((sum, row) => sum + (row.planningPcs || 0), 0),
    overtimePcs: flatRows.reduce((sum, row) => sum + (row.overtimePcs || 0), 0),
    hasilProduksi: flatRows.reduce((sum, row) => sum + (row.pcs || 0), 0),
    jamProduksiAktual: flatRows.reduce(
      (sum, row) => sum + (row.jamProduksiAktual || 0),
      0,
    ),
  };
};

// Fungsi untuk format jam produksi
export const formatJamProduksi = (
  pcs: number,
  outputPerHour: number,
): string => {
  if (pcs > 0 && outputPerHour > 0) {
    return (Math.ceil((pcs / outputPerHour) * 10) / 10).toFixed(1);
  }
  return "0.0";
};

// Fungsi untuk format angka dengan separator ribuan
export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

// Fungsi untuk format angka dengan 1 desimal
export const formatNumberWithDecimal = (value: number): string => {
  return value.toFixed(1);
};

// Fungsi untuk menghitung akumulasi delivery
export const calculateAkumulasiDelivery = (
  currentDay: number,
  validGroupedRows: { day: number; rows: ScheduleItem[] }[],
  groupIndex: number,
): { shift1: number; shift2: number } => {
  let akumulasiShift1 = 0;
  let akumulasiShift2 = 0;

  if (groupIndex === 0) {
    const shift1 = validGroupedRows[0].rows.find((r) => r.shift === "1");
    const shift2 = validGroupedRows[0].rows.find((r) => r.shift === "2");
    akumulasiShift1 = shift1?.delivery || 0;
    akumulasiShift2 = akumulasiShift1 + (shift2?.delivery || 0);
  } else {
    const prevGroup = validGroupedRows[groupIndex - 1];
    const prevShift2 = prevGroup.rows.find((r) => r.shift === "2");
    const prevAkumulasi = prevShift2?.akumulasiDelivery || 0;

    const shift1 = validGroupedRows[groupIndex].rows.find(
      (r) => r.shift === "1",
    );
    const shift2 = validGroupedRows[groupIndex].rows.find(
      (r) => r.shift === "2",
    );

    akumulasiShift1 = prevAkumulasi + (shift1?.delivery || 0);
    akumulasiShift2 = akumulasiShift1 + (shift2?.delivery || 0);
  }

  return { shift1: akumulasiShift1, shift2: akumulasiShift2 };
};

// Fungsi untuk menghitung akumulasi hasil produksi
export const calculateAkumulasiHasilProduksi = (
  currentDay: number,
  validGroupedRows: { day: number; rows: ScheduleItem[] }[],
  groupIndex: number,
): { shift1: number; shift2: number } => {
  let akumulasiHasilShift1 = 0;
  let akumulasiHasilShift2 = 0;

  if (groupIndex === 0) {
    const shift1 = validGroupedRows[0].rows.find((r) => r.shift === "1");
    const shift2 = validGroupedRows[0].rows.find((r) => r.shift === "2");
    akumulasiHasilShift1 = shift1?.pcs || 0;
    akumulasiHasilShift2 = akumulasiHasilShift1 + (shift2?.pcs || 0);
  } else {
    const prevGroup = validGroupedRows[groupIndex - 1];
    const prevShift2 = prevGroup.rows.find((r) => r.shift === "2");
    const prevAkumulasi = prevShift2?.akumulasiHasilProduksi || 0;

    const shift1 = validGroupedRows[groupIndex].rows.find(
      (r) => r.shift === "1",
    );
    const shift2 = validGroupedRows[groupIndex].rows.find(
      (r) => r.shift === "2",
    );

    akumulasiHasilShift1 = prevAkumulasi + (shift1?.pcs || 0);
    akumulasiHasilShift2 = akumulasiHasilShift1 + (shift2?.pcs || 0);
  }

  return { shift1: akumulasiHasilShift1, shift2: akumulasiHasilShift2 };
};

// Fungsi untuk menghitung stock custom (actual, rencana)
export const calculateStockCustom = (
  row: ScheduleItem,
  group: { day: number; rows: ScheduleItem[] },
  validGroupedRows: { day: number; rows: ScheduleItem[] }[],
  groupIndex: number,
  initialStock: number,
): { actualStock: number; rencanaStock: number } => {
  const isHariPertama = groupIndex === 0 && row.shift === "1";
  const isShift1 = row.shift === "1";
  const isShift2 = row.shift === "2";

  const prevDayGroup =
    groupIndex > 0 ? validGroupedRows[groupIndex - 1] : undefined;
  const prevDayShift2 = prevDayGroup
    ? prevDayGroup.rows.find((r) => r.shift === "2")
    : undefined;

  const prevActualStockShift2 = prevDayShift2
    ? (prevDayShift2.actualStockCustom ?? 0)
    : initialStock;
  const prevRencanaStockShift2 = prevDayShift2
    ? (prevDayShift2.rencanaStockCustom ?? 0)
    : initialStock;

  const hasilProduksi = row.pcs || 0;
  const planningPcs = row.planningPcs || 0;
  const overtimePcs = row.overtimePcs || 0;
  const delivery = row.delivery || 0;

  let actualStock = 0;
  let rencanaStock = 0;

  if (isHariPertama) {
    // Hari pertama shift 1 menggunakan initialStock
    actualStock =
      hasilProduksi === 0
        ? initialStock + planningPcs + overtimePcs - delivery
        : initialStock + hasilProduksi - delivery;
    rencanaStock = initialStock + planningPcs + overtimePcs - delivery;
  } else if (isShift1) {
    // Shift 1 hari berikutnya
    actualStock =
      hasilProduksi === 0
        ? prevActualStockShift2 + planningPcs + overtimePcs - delivery
        : prevActualStockShift2 + hasilProduksi - delivery;
    rencanaStock =
      prevRencanaStockShift2 + planningPcs + overtimePcs - delivery;
  } else if (isShift2) {
    // Shift 2
    const shift1Row = group.rows.find((r) => r.shift === "1");
    const shift1ActualStock = shift1Row?.actualStockCustom ?? initialStock;

    actualStock =
      hasilProduksi === 0
        ? shift1ActualStock + planningPcs + overtimePcs - delivery
        : shift1ActualStock + hasilProduksi - delivery;
    rencanaStock = shift1ActualStock + planningPcs + overtimePcs - delivery;
  }

  return { actualStock, rencanaStock };
};
