import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSchedule } from "../contexts/ScheduleContext";
import { useTheme } from "../../contexts/ThemeContext";
import StatsCards from "../components/layout/StatsCards";
import ProductionChart from "../components/layout/ProductionChart";
import { MONTHS } from "../utils/scheduleDateUtils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
// Import services untuk mengambil data dari database
import {
  ChildPartService,
  PlanningSystemService,
  ProductionService,
  RencanaChildPartService,
} from "../../../services/API_Services";

// Singkatan bulan untuk dropdown
const MONTH_ABBREVIATIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

interface ScheduleItem {
  id: string;
  day: number;
  shift: string;
  type: string;
  pcs: number;
  time: string;
  processes: string;
  status: "Normal" | "Gangguan" | "Completed";
  actualPcs?: number;
  notes?: string;
  delivery?: number;
  planningPcs?: number;
  overtimePcs?: number;
  planningHour?: number;
  overtimeHour?: number;
  jamProduksiAktual?: number;
  akumulasiDelivery?: number;
  hasilProduksi?: number;
  akumulasiHasilProduksi?: number;
  jamProduksiCycleTime?: number;
  actualStock?: number;
  rencanaStockCustom?: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { savedSchedules } = useSchedule();
  const { uiColors } = useTheme();

  // State untuk menyimpan data part dari database
  const [partOptions, setPartOptions] = useState<string[]>([]);
  const [childPartOptions, setChildPartOptions] = useState<string[]>([]);
  const [finishGoodPartOptions, setFinishGoodPartOptions] = useState<string[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // State untuk menyimpan data daily production
  const [dailyProductionData, setDailyProductionData] = useState<any[]>([]);
  const [childPartData, setChildPartData] = useState<any[]>([]);
  const [isLoadingDailyProduction, setIsLoadingDailyProduction] =
    useState<boolean>(false);
  const [selectedChildPartDetail, setSelectedChildPartDetail] = useState<
    any | null
  >(null);
  const [allChildPartsDetail, setAllChildPartsDetail] = useState<any[]>([]);

  // Debug: Log savedSchedules
  console.log("Dashboard - savedSchedules:", savedSchedules);
  console.log("Dashboard - savedSchedules length:", savedSchedules.length);

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    savedSchedules.length > 0
      ? savedSchedules[savedSchedules.length - 1].id
      : null,
  );

  // Ubah default menjadi string kosong untuk menampilkan semua part
  const [selectedPart, setSelectedPart] = useState<string>("");

  // State untuk pencarian part
  const [searchPart, setSearchPart] = useState<string>("");
  const [showPartDropdown, setShowPartDropdown] = useState<boolean>(false);

  // Tambahkan state untuk filter bulan dan shift dengan default kosong
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(
    currentDate.getFullYear(),
  );
  const [selectedShift, setSelectedShift] = useState<string>("all");

  // State untuk popup date picker
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [tempSelectedMonth, setTempSelectedMonth] = useState<number | null>(
    selectedMonth,
  );
  const [tempSelectedYear, setTempSelectedYear] = useState(selectedYear);

  // Mengambil data part dari database saat komponen dimuat
  useEffect(() => {
    const fetchPartData = async () => {
      setIsLoading(true);
      try {
        // Mengambil data dari ps_child_parts
        const childPartsResponse = await ChildPartService.getAllChildParts();
        const childParts = childPartsResponse.map((part) => part.partName);
        setChildPartOptions(childParts);

        // Mengambil data dari ps_product_planning
        const productPlanningResponse =
          await PlanningSystemService.getAllProductPlanning();
        const productParts = productPlanningResponse.productPlannings.map(
          (part) => part.partName,
        );
        setFinishGoodPartOptions(productParts);

        // Menggabungkan data part dan menghilangkan duplikat
        const allParts = [...new Set([...childParts, ...productParts])];
        setPartOptions(allParts);
      } catch (error) {
        console.error("Error fetching part data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartData();
  }, []);

  // Mengambil data daily production berdasarkan filter
  useEffect(() => {
    const fetchDailyProductionData = async () => {
      setIsLoadingDailyProduction(true);
      try {
        // Ambil semua product planning
        const productPlanningResponse =
          await PlanningSystemService.getAllProductPlanning();
        const productPlannings = productPlanningResponse.productPlannings;

        // Ambil semua child parts (untuk agregasi dan mapping productPlanningId)
        const allChildParts = await ChildPartService.getAllChildParts();
        setAllChildPartsDetail(allChildParts || []);

        // Filter planning berdasarkan part jika dipilih
        let filteredPlannings = productPlannings;
        if (selectedPart) {
          filteredPlannings = productPlannings.filter(
            (planning) => planning.partName === selectedPart,
          );
        }

        // Filter planning berdasarkan bulan dan tahun jika dipilih
        if (selectedMonth !== null) {
          filteredPlannings = filteredPlannings.filter(
            (planning) =>
              planning.productionMonth === selectedMonth &&
              planning.productionYear === selectedYear,
          );
        }

        // Ambil daily production untuk setiap planning
        const allDailyProductions = [];
        for (const planning of filteredPlannings) {
          try {
            const dailyProductions =
              await ProductionService.getDailyProductionByPlanningId(
                planning.id,
              );

            // Filter berdasarkan shift jika dipilih
            let filteredDailyProductions = dailyProductions;
            if (selectedShift !== "all") {
              filteredDailyProductions = dailyProductions.filter(
                (dp) => dp.shift === parseInt(selectedShift),
              );
            }

            // Tambahkan informasi planning ke setiap daily production
            const dailyProductionsWithPlanning = filteredDailyProductions.map(
              (dp) => ({
                ...dp,
                planning: planning,
              }),
            );

            allDailyProductions.push(...dailyProductionsWithPlanning);
          } catch (error) {
            console.error(
              `Error fetching daily production for planning ${planning.id}:`,
              error,
            );
          }
        }

        console.log("Daily production data from API:", allDailyProductions);
        if (allDailyProductions.length > 0) {
          console.log(
            "Sample daily production item from API:",
            allDailyProductions[0],
          );
          console.log(
            "Available fields in daily production:",
            Object.keys(allDailyProductions[0]),
          );
        } else {
          console.log("No daily production data from API - will use fallback");
        }
        setDailyProductionData(allDailyProductions);

        // Ambil data child part jika part yang dipilih adalah child part
        if (selectedPart && childPartOptions.includes(selectedPart)) {
          try {
            const selectedChildPart = (allChildParts || []).find(
              (cp) => cp.partName === selectedPart,
            );

            if (selectedChildPart) {
              setSelectedChildPartDetail(selectedChildPart);
              // Ambil rencana child part untuk part ini
              const rencanaChildParts =
                await RencanaChildPartService.getRencanaChildPartByChildPartId(
                  selectedChildPart.id,
                );

              // Filter berdasarkan bulan dan tahun jika dipilih
              let filteredRencana = rencanaChildParts;
              if (selectedMonth !== null) {
                filteredRencana = rencanaChildParts.filter(
                  (rcp) =>
                    rcp.bulan === selectedMonth && rcp.tahun === selectedYear,
                );
              }

              // Filter berdasarkan shift jika dipilih
              if (selectedShift !== "all") {
                filteredRencana = filteredRencana.filter(
                  (rcp) => rcp.shift === parseInt(selectedShift),
                );
              }

              console.log("Child part data:", filteredRencana);
              if (filteredRencana.length > 0) {
                console.log("Sample child part item:", filteredRencana[0]);
              }
              setChildPartData(filteredRencana);
            }
          } catch (error) {
            console.error("Error fetching child part data:", error);
            setChildPartData([]);
          }
        } else {
          // Agregasi semua child part untuk bulan/tahun & shift terpilih (atau bulan berjalan jika tidak dipilih)
          try {
            const monthForAgg =
              selectedMonth !== null ? selectedMonth : new Date().getMonth();
            const yearForAgg = selectedYear;

            const allRencana =
              await RencanaChildPartService.getRencanaChildPartByBulanTahun(
                monthForAgg + 1,
                yearForAgg,
              );

            // Filter shift jika dipilih
            let filteredAgg = allRencana || [];
            if (selectedShift !== "all") {
              filteredAgg = filteredAgg.filter(
                (rcp: any) => rcp.shift === parseInt(selectedShift),
              );
            }
            setChildPartData(filteredAgg);
            setSelectedChildPartDetail(null);
          } catch (e) {
            console.error("Error aggregating child part data:", e);
            setChildPartData([]);
          }
        }
      } catch (error) {
        console.error("Error fetching daily production data:", error);
      } finally {
        setIsLoadingDailyProduction(false);
      }
    };

    fetchDailyProductionData();
  }, [
    selectedPart,
    selectedMonth,
    selectedYear,
    selectedShift,
    childPartOptions,
  ]);

  // Filter part berdasarkan pencarian
  const filteredPartOptions = partOptions.filter((part) => {
    // Hapus semua spasi dari part dan search query untuk perbandingan
    const partNoSpaces = part.toLowerCase().replace(/\s+/g, "");
    const searchNoSpaces = searchPart.toLowerCase().replace(/\s+/g, "");
    return partNoSpaces.includes(searchNoSpaces);
  });

  // Mendapatkan schedule yang dipilih
  const selectedSchedule = React.useMemo(() => {
    if (!selectedScheduleId) return [];
    const found = savedSchedules.find((s) => s.id === selectedScheduleId);
    return found ? found.schedule : [];
  }, [selectedScheduleId, savedSchedules]);

  // Mendapatkan semua schedule untuk part yang dipilih dengan filter bulan dan shift
  const filteredSchedules = React.useMemo(() => {
    // Mulai dengan semua schedule
    let filtered = [...savedSchedules];

    // Debug: Log initial filtered schedules
    console.log("Dashboard - Initial filtered schedules:", filtered);
    console.log("Dashboard - selectedPart:", selectedPart);
    console.log("Dashboard - selectedMonth:", selectedMonth);
    console.log("Dashboard - selectedYear:", selectedYear);
    console.log("Dashboard - selectedShift:", selectedShift);

    // Filter berdasarkan part jika dipilih
    if (selectedPart) {
      filtered = filtered.filter(
        (schedule) => schedule.form && schedule.form.part === selectedPart,
      );
      console.log("Dashboard - After part filter:", filtered);
    }

    // Filter berdasarkan bulan dan tahun jika bulan dipilih
    if (selectedMonth !== null) {
      filtered = filtered.filter((schedule) => {
        const scheduleName = schedule.name || "";
        const monthMatch = scheduleName.includes(MONTHS[selectedMonth]);
        const yearMatch = scheduleName.includes(selectedYear.toString());
        return monthMatch && yearMatch;
      });
      console.log("Dashboard - After month/year filter:", filtered);
    }

    // Jika shift dipilih, filter schedule items berdasarkan shift
    if (selectedShift !== "all") {
      filtered = filtered.map((schedule) => ({
        ...schedule,
        schedule: schedule.schedule.filter(
          (item) => item.shift === selectedShift,
        ),
      }));
      console.log("Dashboard - After shift filter:", filtered);
    }

    console.log("Dashboard - Final filtered schedules:", filtered);
    return filtered;
  }, [
    savedSchedules,
    selectedPart,
    selectedMonth,
    selectedYear,
    selectedShift,
  ]);

  // Handler untuk tombol Lihat Semua
  const handleViewAllCharts = () => {
    // Buka halaman "Semua Chart Akumulasi Delivery"
    navigate("/dashboard/all-delivery-charts");
  };

  // Handler untuk perubahan part
  const handlePartChange = (part: string) => {
    setSelectedPart(part);
    setSearchPart("");
    setShowPartDropdown(false);
  };

  // Handler untuk input pencarian part
  const handleSearchPartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPart(e.target.value);
    setShowPartDropdown(true);
  };

  // Handler untuk perubahan bulan
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedMonth(value === "" ? null : parseInt(value));
  };

  // Handler untuk perubahan shift
  const handleShiftChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedShift(e.target.value);
  };

  // Handler untuk membuka popup date picker
  const handleOpenDatePicker = () => {
    setTempSelectedMonth(selectedMonth);
    setTempSelectedYear(selectedYear);
    setShowDatePickerModal(true);
  };

  // Handler untuk konfirmasi pilihan bulan dan tahun
  const handleConfirmDateSelection = () => {
    setSelectedMonth(tempSelectedMonth);
    setSelectedYear(tempSelectedYear);
    setShowDatePickerModal(false);
  };

  // Tambahkan state untuk menentukan apakah part yang dipilih adalah child part
  const isSelectedPartChildPart = React.useMemo(() => {
    if (!selectedPart) return false;
    return childPartOptions.includes(selectedPart);
  }, [selectedPart, childPartOptions]);

  // Tambahkan state untuk menentukan apakah part yang dipilih adalah finish good part
  const isSelectedPartFinishGoodPart = React.useMemo(() => {
    if (!selectedPart) return false;
    return finishGoodPartOptions.includes(selectedPart);
  }, [selectedPart, finishGoodPartOptions]);

  // Calculate stats berdasarkan data daily production
  const stats = React.useMemo(() => {
    if (isLoadingDailyProduction) {
      return {
        totalProduction: 0,
        totalPlanned: 0,
        totalDays: 0,
        disruptedItems: 0,
        deliveryActual: 0,
        planningProduksiPcs: 0,
        planningProduksiJam: 0,
        overtimePcs: 0,
        overtimeJam: 0,
        jamProduksiCycleTime: 0,
        jamProduksiAktual: 0,
        hasilProduksiAktual: 0,
        actualStock: 0,
        rencanaStock: 0,
        rencanaInMaterial: 0,
        aktualInMaterial: 0,
      };
    }

    // Helper function untuk mendapatkan nilai dengan berbagai kemungkinan field name
    const getValue = (item: any, possibleFields: string[]): number => {
      for (const field of possibleFields) {
        if (item[field] !== undefined && item[field] !== null) {
          return Number(item[field]) || 0;
        }
      }
      return 0;
    };

    // Jika tidak ada data dari API, gunakan data dari savedSchedules sebagai fallback
    let dataSource = dailyProductionData;
    let isUsingFallback = false;

    if (dailyProductionData.length === 0 && filteredSchedules.length > 0) {
      console.log("No API data found, using savedSchedules as fallback");
      isUsingFallback = true;
      // Konversi savedSchedules ke format yang sesuai
      dataSource = filteredSchedules.flatMap((schedule) =>
        schedule.schedule.map((item) => {
          console.log("Processing fallback item:", item);
          console.log("Item delivery fields:", {
            delivery: item.delivery,
            deliveryPcs: (item as any).deliveryPcs,
            deliveryActual: (item as any).deliveryActual,
          });
          console.log("Item manpower fields:", {
            manpowerIds: item.manpowerIds,
            manpower: item.manpower,
          });

          return {
            ...item,
            // Standardize field names
            actualProduction: getValue(item, [
              "actualPcs",
              "hasilProduksi",
              "pcs",
            ]),
            planningProduction: getValue(item, ["planningPcs", "pcs"]),
            deliveryActual:
              getValue(item, ["delivery", "deliveryPcs", "deliveryActual"]) ||
              item.delivery ||
              (item as any).deliveryPcs ||
              0,
            actualProductionHours: getValue(item, ["jamProduksiAktual"]),
            overtime: getValue(item, ["overtimePcs"]),
            manpower: (() => {
              // Cek manpowerIds array terlebih dahulu
              if (
                item.manpowerIds &&
                Array.isArray(item.manpowerIds) &&
                item.manpowerIds.length > 0
              ) {
                return item.manpowerIds.length;
              }
              // Cek field manpower langsung
              else if (
                item.manpower &&
                typeof item.manpower === "number" &&
                item.manpower > 0
              ) {
                return item.manpower;
              }
              // Cek field manpower sebagai boolean
              else if ((item.manpower as any) === true || item.manpower === 1) {
                return 1;
              }
              // Cek menggunakan getValue helper
              else {
                const manpowerValue = getValue(item, ["manpower"]);
                if (
                  manpowerValue &&
                  typeof manpowerValue === "number" &&
                  manpowerValue > 0
                ) {
                  return manpowerValue;
                }
              }
              return 0;
            })(),
            actualStockCustom: getValue(item, [
              "actualStockCustom",
              "actualStock",
            ]),
            rencanaStockCustom: getValue(item, [
              "rencanaStockCustom",
              "rencanaStock",
            ]),
            // Tambahkan field untuk jam produksi
            jamProduksiCycleTime: getValue(item, ["jamProduksiCycleTime"]),
            jamProduksiAktual: getValue(item, ["jamProduksiAktual"]),
            overtimeJam: getValue(item, ["overtimeJam"]),
            // Pastikan field yang diperlukan tersedia
            manpowerIds: item.manpowerIds || [],
          };
        }),
      );
    }

    console.log("Data source for stats calculation:", dataSource);
    console.log("Is using fallback:", isUsingFallback);
    console.log("Daily production data length:", dailyProductionData.length);
    console.log("Filtered schedules length:", filteredSchedules.length);

    // Debug untuk melihat data savedSchedules
    if (filteredSchedules.length > 0) {
      console.log("Sample filtered schedule:", filteredSchedules[0]);
      console.log("Sample schedule item:", filteredSchedules[0]?.schedule?.[0]);
      console.log(
        "Sample item fields:",
        Object.keys(filteredSchedules[0]?.schedule?.[0] || {}),
      );

      // Debug khusus untuk manpower
      console.log("=== MANPOWER DEBUG ===");
      filteredSchedules[0]?.schedule?.forEach((item, index) => {
        console.log(`Item ${index}:`, {
          id: item.id,
          manpower: item.manpower,
          manpowerIds: item.manpowerIds,
          manpowerType: typeof item.manpower,
          manpowerIdsType: Array.isArray(item.manpowerIds)
            ? "array"
            : typeof item.manpowerIds,
          manpowerIdsLength: item.manpowerIds?.length || 0,
        });
      });
    }

    // Tambahkan debug untuk melihat semua field yang tersedia
    if (dataSource.length > 0) {
      console.log(
        "All available fields in first data item:",
        Object.keys(dataSource[0]),
      );
      console.log("Sample values for key fields:");
      const sample = dataSource[0];
      console.log(
        "- actualProduction:",
        getValue(sample, ["actualProduction", "hasilProduksi", "actualPcs"]),
      );
      console.log(
        "- planningProduction:",
        getValue(sample, ["planningProduction", "planningPcs", "pcs"]),
      );
      console.log(
        "- deliveryActual:",
        getValue(sample, ["deliveryActual", "delivery"]),
      );
      console.log(
        "- manpower:",
        getValue(sample, ["manpower"]) + (sample.manpowerIds?.length || 0),
      );
    }

    // Hitung stok child part (rencana & aktual) jika part yang dipilih adalah child part
    const computeChildPartStocks = () => {
      try {
        if (!isSelectedPartChildPart || !selectedChildPartDetail) {
          return { childRencana: 0, childAktual: 0 };
        }

        // Ambil schedule dari savedSchedules berdasarkan productPlanningId
        const scheduleForPlanning = savedSchedules.find(
          (s) =>
            s.backendId &&
            s.backendId === selectedChildPartDetail.productPlanningId,
        )?.schedule;

        if (
          !Array.isArray(scheduleForPlanning) ||
          scheduleForPlanning.length === 0
        ) {
          return { childRencana: 0, childAktual: 0 };
        }

        // Tentukan jumlah hari dari schedule
        const daysCount =
          Math.max(
            ...scheduleForPlanning.map((it: any) =>
              typeof it.day === "number" ? it.day : 0,
            ),
          ) || 30;

        // Siapkan array in material dari data childPartData
        const inR: number[][] = Array.from({ length: daysCount }, () => [0, 0]);
        const inA: number[][] = Array.from({ length: daysCount }, () => [0, 0]);

        const getVal = (obj: any, keys: string[]): number => {
          for (const k of keys) {
            if (obj && obj[k] !== undefined && obj[k] !== null) {
              const num = Number(obj[k]);
              return Number.isFinite(num) ? num : 0;
            }
          }
          return 0;
        };

        childPartData.forEach((rcp: any) => {
          const d = (rcp.hari || rcp.day || 1) - 1;
          const s = ((rcp.shift || 1) as number) - 1;
          if (d >= 0 && d < daysCount && (s === 0 || s === 1)) {
            inR[d][s] = getVal(rcp, [
              "rencanaInMaterial",
              "rencana_inmaterial",
            ]);
            inA[d][s] = getVal(rcp, ["aktualInMaterial", "aktual_inmaterial"]);
          }
        });

        const safeInitial = Number(selectedChildPartDetail.stockAvailable) || 0;

        // Helper schedule lookup
        const findScheduleItem = (dayIdx: number, shiftIdx: number) => {
          const shiftStr = shiftIdx === 0 ? "1" : "2";
          return scheduleForPlanning.find(
            (s: any) => s.day === dayIdx + 1 && String(s.shift) === shiftStr,
          );
        };

        // Rencana stock
        const rencanaStock: number[] = [];
        for (let d = 0; d < daysCount; d++) {
          for (let s = 0; s < 2; s++) {
            const idx = d * 2 + s;
            const item = findScheduleItem(d, s);
            const planningPcs = getVal(item || {}, [
              "planningPcs",
              "planningProduction",
              "pcs",
            ]);
            const overtimePcs = getVal(item || {}, ["overtimePcs", "overtime"]);

            if (
              getVal(item || {}, [
                "hasilProduksi",
                "actualPcs",
                "actualProduction",
              ]) === 0
            ) {
              if (idx === 0) {
                rencanaStock[idx] =
                  safeInitial + (inR[d][s] || 0) - (planningPcs + overtimePcs);
              } else {
                rencanaStock[idx] =
                  rencanaStock[idx - 1] +
                  (inR[d][s] || 0) -
                  (planningPcs + overtimePcs);
              }
            } else {
              if (idx === 0) {
                rencanaStock[idx] =
                  safeInitial +
                  (inR[d][s] || 0) -
                  getVal(item || {}, [
                    "hasilProduksi",
                    "actualPcs",
                    "actualProduction",
                  ]);
              } else {
                rencanaStock[idx] =
                  rencanaStock[idx - 1] +
                  (inR[d][s] || 0) -
                  getVal(item || {}, [
                    "hasilProduksi",
                    "actualPcs",
                    "actualProduction",
                  ]);
              }
            }
          }
        }

        // Aktual stock
        const aktualStock: number[] = [];
        for (let d = 0; d < daysCount; d++) {
          for (let s = 0; s < 2; s++) {
            const idx = d * 2 + s;
            const item = findScheduleItem(d, s);
            const aktualIn = inA[d][s] || 0;
            const hasil = getVal(item || {}, [
              "hasilProduksi",
              "actualPcs",
              "actualProduction",
            ]);
            const planningPcs = getVal(item || {}, [
              "planningPcs",
              "planningProduction",
              "pcs",
            ]);
            const overtimePcs = getVal(item || {}, ["overtimePcs", "overtime"]);

            if (hasil === 0) {
              if (idx === 0) {
                aktualStock[idx] =
                  safeInitial + aktualIn - (planningPcs + overtimePcs);
              } else {
                aktualStock[idx] =
                  aktualStock[idx - 1] + aktualIn - (planningPcs + overtimePcs);
              }
            } else {
              if (idx === 0) {
                aktualStock[idx] = safeInitial + aktualIn - hasil;
              } else {
                aktualStock[idx] = aktualStock[idx - 1] + aktualIn - hasil;
              }
            }
          }
        }

        const childRencana =
          rencanaStock.length > 0 ? rencanaStock[rencanaStock.length - 1] : 0;
        const childAktual =
          aktualStock.length > 0 ? aktualStock[aktualStock.length - 1] : 0;
        return { childRencana, childAktual };
      } catch (err) {
        console.error("Error computing child part stocks:", err);
        return { childRencana: 0, childAktual: 0 };
      }
    };

    const { childRencana, childAktual } = computeChildPartStocks();

    const calculatedStats = {
      totalProduction: dataSource.reduce(
        (total, dp) =>
          total +
          getValue(dp, ["actualProduction", "hasilProduksi", "actualPcs"]),
        0,
      ),
      totalPlanned: dataSource.reduce(
        (total, dp) =>
          total + getValue(dp, ["planningProduction", "planningPcs", "pcs"]),
        0,
      ),
      totalDays: dataSource.length,
      disruptedItems: dataSource.reduce((total, dp) => {
        // Coba berbagai kemungkinan field untuk manpower
        let manpowerCount = 0;

        // Debug untuk melihat semua kemungkinan field manpower
        console.log("=== MANPOWER ITEM DEBUG ===");
        console.log("Item ID:", dp.id);
        console.log("All item fields:", Object.keys(dp));
        console.log("Manpower related fields:", {
          manpower: dp.manpower,
          manpowerIds: dp.manpowerIds,
          manpowerType: typeof dp.manpower,
          manpowerIdsType: Array.isArray(dp.manpowerIds)
            ? "array"
            : typeof dp.manpowerIds,
          manpowerIdsLength: dp.manpowerIds?.length || 0,
          manpowerDirect: dp.manpower,
          manpowerFromGetValue: getValue(dp, ["manpower"]),
        });

        // Cek manpowerIds array terlebih dahulu
        if (
          dp.manpowerIds &&
          Array.isArray(dp.manpowerIds) &&
          dp.manpowerIds.length > 0
        ) {
          manpowerCount = dp.manpowerIds.length;
          console.log("Using manpowerIds array length:", manpowerCount);
        }
        // Cek field manpower langsung
        else if (
          dp.manpower &&
          typeof dp.manpower === "number" &&
          dp.manpower > 0
        ) {
          manpowerCount = dp.manpower;
          console.log("Using direct manpower field:", manpowerCount);
        }
        // Cek field manpower sebagai boolean
        else if ((dp.manpower as any) === true || dp.manpower === 1) {
          manpowerCount = 1;
          console.log("Using manpower as boolean/1:", manpowerCount);
        }
        // Cek menggunakan getValue helper
        else {
          const manpowerValue = getValue(dp, ["manpower"]);
          if (
            manpowerValue &&
            typeof manpowerValue === "number" &&
            manpowerValue > 0
          ) {
            manpowerCount = manpowerValue;
            console.log("Using manpower from getValue:", manpowerCount);
          }
        }

        // Jika masih 0, coba cek field lain yang mungkin berisi data manpower
        if (manpowerCount === 0) {
          // Cek apakah ada field lain yang mungkin berisi data manpower
          const allFields = Object.keys(dp);
          const manpowerRelatedFields = allFields.filter(
            (field) =>
              field.toLowerCase().includes("manpower") ||
              field.toLowerCase().includes("worker") ||
              field.toLowerCase().includes("person"),
          );
          console.log(
            "Other manpower-related fields found:",
            manpowerRelatedFields,
          );

          // Jika tidak ada data manpower sama sekali, gunakan default 1
          if (manpowerRelatedFields.length === 0) {
            manpowerCount = 1; // Default 1 manpower per item
            console.log(
              "No manpower data found, using default:",
              manpowerCount,
            );
          }
        }

        console.log("Final manpower count for item:", manpowerCount);
        return total + manpowerCount;
      }, 0),
      // Data untuk finish good part
      deliveryActual: dataSource.reduce((total, dp) => {
        // Coba berbagai kemungkinan field untuk delivery
        const deliveryValue =
          getValue(dp, ["deliveryActual", "delivery", "deliveryPcs"]) ||
          dp.delivery ||
          dp.deliveryActual ||
          0;
        console.log("Delivery calculation for item:", {
          deliveryActual: dp.deliveryActual,
          delivery: dp.delivery,
          deliveryPcs: dp.deliveryPcs,
          calculated: deliveryValue,
        });
        return total + deliveryValue;
      }, 0),
      planningProduksiPcs: dataSource.reduce(
        (total, dp) =>
          total + getValue(dp, ["planningProduction", "planningPcs", "pcs"]),
        0,
      ),
      planningProduksiJam: dataSource.reduce((total, dp) => {
        // Hitung planning produksi jam berdasarkan planning pcs dan output per jam
        const planningPcs = getValue(dp, [
          "planningProduction",
          "planningPcs",
          "pcs",
        ]);
        const manpower = dp.manpowerIds?.length || 3;
        const pcsPerManpower = 14 / 3; // 4.666 pcs per manpower
        const outputPerHour = manpower * pcsPerManpower;
        return total + (outputPerHour > 0 ? planningPcs / outputPerHour : 0);
      }, 0),
      overtimePcs: dataSource.reduce(
        (total, dp) => total + getValue(dp, ["overtime", "overtimePcs"]),
        0,
      ),
      overtimeJam: dataSource.reduce((total, dp) => {
        // Hitung overtime jam berdasarkan overtime pcs dan output per jam
        const overtimePcs = getValue(dp, ["overtime", "overtimePcs"]);
        const manpower = dp.manpowerIds?.length || 3;
        const pcsPerManpower = 14 / 3; // 4.666 pcs per manpower
        const outputPerHour = manpower * pcsPerManpower;
        return total + (outputPerHour > 0 ? overtimePcs / outputPerHour : 0);
      }, 0),
      jamProduksiCycleTime: dataSource.reduce((total, dp) => {
        // Hitung jam produksi cycle time berdasarkan pcs dan manpower
        const pcs = getValue(dp, [
          "actualProduction",
          "hasilProduksi",
          "actualPcs",
        ]);
        const manpower = dp.manpowerIds?.length || 3;
        const pcsPerManpower = 14 / 3; // 4.666 pcs per manpower
        const outputPerHour = manpower * pcsPerManpower;
        return total + (outputPerHour > 0 ? pcs / outputPerHour : 0);
      }, 0),
      hasilProduksiAktual: dataSource.reduce(
        (total, dp) =>
          total +
          getValue(dp, ["actualProduction", "hasilProduksi", "actualPcs"]),
        0,
      ),
      // Tambahkan perhitungan jam produksi aktual
      jamProduksiAktual: dataSource.reduce((total, dp) => {
        // Hitung jam produksi aktual berdasarkan pcs dan timePerPcs
        const pcs = getValue(dp, [
          "actualProduction",
          "hasilProduksi",
          "actualPcs",
        ]);
        // Gunakan nilai default timePerPcs jika tidak tersedia
        const defaultTimePerPcs = 3600 / 14; // 14 pcs per jam
        const outputPerHour =
          defaultTimePerPcs > 0 ? 3600 / defaultTimePerPcs : 0;
        return total + (outputPerHour > 0 ? pcs / outputPerHour : 0);
      }, 0),
      actualStock: (() => {
        // Ambil data terakhir yang memiliki actual stock > 0
        const lastItemWithStock = dataSource
          .filter((dp) => getValue(dp, ["actualStockCustom"]) > 0)
          .pop();
        return lastItemWithStock
          ? getValue(lastItemWithStock, ["actualStockCustom"])
          : 0;
      })(),
      rencanaStock: (() => {
        // Ambil data terakhir yang memiliki rencana stock > 0
        const lastItemWithStock = dataSource
          .filter((dp) => getValue(dp, ["rencanaStockCustom"]) > 0)
          .pop();
        return lastItemWithStock
          ? getValue(lastItemWithStock, ["rencanaStockCustom"])
          : 0;
      })(),
      // Data untuk child part dari rencana child part
      // Total child part menggunakan kedua kemungkinan nama field (frontend casing & backend snake_case)
      rencanaInMaterial: childPartData.reduce(
        (total, rcp) =>
          total + getValue(rcp, ["rencanaInMaterial", "rencana_inmaterial"]),
        0,
      ),
      aktualInMaterial: childPartData.reduce(
        (total, rcp) =>
          total + getValue(rcp, ["aktualInMaterial", "aktual_inmaterial"]),
        0,
      ),
    } as any;

    // Jika child part dipilih ATAU mode semua part (agregasi), gunakan nilai stok child part hasil hitung
    if (
      isSelectedPartChildPart ||
      (!selectedPart && childPartData.length > 0)
    ) {
      calculatedStats.rencanaStock = childRencana;
      calculatedStats.actualStock = childAktual;
    }

    console.log("Calculated stats with debug:", calculatedStats);
    console.log("Stats calculation details:");
    console.log(
      "- totalProduction items:",
      dataSource.map((dp) =>
        getValue(dp, ["actualProduction", "hasilProduksi", "actualPcs"]),
      ),
    );
    console.log(
      "- deliveryActual items:",
      dataSource.map((dp) => {
        const deliveryValue =
          getValue(dp, ["deliveryActual", "delivery", "deliveryPcs"]) || 0;
        return deliveryValue;
      }),
    );
    console.log(
      "- delivery details:",
      dataSource.map((dp) => ({
        deliveryActual: dp.deliveryActual,
        delivery: dp.delivery,
        deliveryPcs: dp.deliveryPcs,
      })),
    );
    console.log(
      "- manpower items:",
      dataSource.map((dp) => {
        const manpowerCount =
          dp.manpowerIds?.length ||
          getValue(dp, ["manpower"]) ||
          (dp.manpower ? 1 : 0) ||
          0;
        return manpowerCount;
      }),
    );
    console.log(
      "- manpower details:",
      dataSource.map((dp) => ({
        manpowerIds: dp.manpowerIds,
        manpowerField: getValue(dp, ["manpower"]),
        manpowerDirect: dp.manpower,
      })),
    );
    console.log(
      "- planningProduksiPcs items:",
      dataSource.map((dp) =>
        getValue(dp, ["planningProduction", "planningPcs", "pcs"]),
      ),
    );
    console.log(
      "- overtimePcs items:",
      dataSource.map((dp) => getValue(dp, ["overtime", "overtimePcs"])),
    );
    console.log(
      "- actualStock items:",
      dataSource.map((dp) => getValue(dp, ["actualStockCustom"])),
    );
    console.log(
      "- rencanaStock items:",
      dataSource.map((dp) => getValue(dp, ["rencanaStockCustom"])),
    );
    console.log("Data source length:", dataSource.length);
    console.log("Sample data source item:", dataSource[0]);

    return calculatedStats;
  }, [
    dailyProductionData,
    childPartData,
    isLoadingDailyProduction,
    filteredSchedules,
  ]);

  return (
    <div className={`w-full min-h-screen ${uiColors.bg.primary}`}>
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        <h1
          className={`text-2xl sm:text-3xl font-bold ${uiColors.text.accent} mb-4 sm:mb-8`}
        >
          Dashboard
        </h1>

        {/* Filter Section */}
        <div className="mb-6 p-4 bg-opacity-50 rounded-xl bg-gray-100 dark:bg-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Part Filter - Diubah menjadi searchable dropdown */}
            <div>
              <label
                htmlFor="partSearch"
                className={`block mb-2 text-sm font-medium ${uiColors.text.primary}`}
              >
                Pilih Part:
              </label>
              <div className="relative">
                <input
                  id="partSearch"
                  type="text"
                  value={searchPart}
                  onChange={handleSearchPartChange}
                  onFocus={() => setShowPartDropdown(true)}
                  placeholder={selectedPart || "Cari part..."}
                  className={`${uiColors.bg.secondary} ${uiColors.text.primary} border ${uiColors.border.secondary} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full`}
                />
                {showPartDropdown && (
                  <div
                    className={`absolute z-10 mt-1 w-full ${uiColors.bg.secondary} border ${uiColors.border.secondary} rounded-md shadow-lg max-h-60 overflow-auto`}
                  >
                    <div className="py-1">
                      <button
                        onClick={() => handlePartChange("")}
                        className={`${uiColors.text.primary} hover:${uiColors.bg.tertiary} px-4 py-2 text-sm w-full text-left`}
                      >
                        Semua Part
                      </button>
                      {isLoading ? (
                        <div
                          className={`${uiColors.text.tertiary} px-4 py-2 text-sm italic`}
                        >
                          Memuat data part...
                        </div>
                      ) : (
                        filteredPartOptions.map((part) => (
                          <button
                            key={part}
                            onClick={() => handlePartChange(part)}
                            className={`${uiColors.text.primary} hover:${uiColors.bg.tertiary} px-4 py-2 text-sm w-full text-left ${selectedPart === part ? "bg-blue-100 dark:bg-blue-900" : ""}`}
                          >
                            {part}
                          </button>
                        ))
                      )}
                      {!isLoading && filteredPartOptions.length === 0 && (
                        <div
                          className={`${uiColors.text.tertiary} px-4 py-2 text-sm italic`}
                        >
                          Tidak ada part yang ditemukan
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Month Filter - Changed to button that opens modal */}
            <div>
              <label
                className={`block mb-2 text-sm font-medium ${uiColors.text.primary}`}
              >
                Pilih Bulan:
              </label>
              <button
                onClick={handleOpenDatePicker}
                className={`${uiColors.bg.secondary} ${uiColors.text.primary} border ${uiColors.border.secondary} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full text-left flex justify-between items-center`}
              >
                <span>
                  {selectedMonth !== null
                    ? `${MONTHS[selectedMonth]} ${selectedYear}`
                    : "Semua Bulan"}
                </span>
                <svg
                  className="w-4 h-4"
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
              </button>
            </div>

            {/* Shift Filter */}
            <div>
              <label
                htmlFor="shiftSelect"
                className={`block mb-2 text-sm font-medium ${uiColors.text.primary}`}
              >
                Pilih Shift:
              </label>
              <select
                id="shiftSelect"
                value={selectedShift}
                onChange={handleShiftChange}
                className={`${uiColors.bg.secondary} ${uiColors.text.primary} border ${uiColors.border.secondary} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full`}
              >
                <option value="all">Semua Shift</option>
                <option value="1">Shift 1</option>
                <option value="2">Shift 2</option>
              </select>
            </div>
          </div>
        </div>

        {isLoadingDailyProduction ? (
          <div
            className={`${uiColors.bg.secondary} border ${uiColors.border.primary} rounded-xl p-6 text-center`}
          >
            <p className={`text-lg ${uiColors.text.primary}`}>
              Memuat data metrik...
            </p>
          </div>
        ) : (
          <StatsCards
            stats={stats}
            isChildPart={isSelectedPartChildPart}
            showAllMetrics={!selectedPart} // Tampilkan semua metrik jika tidak ada part yang dipilih
            isFinishGoodPart={isSelectedPartFinishGoodPart} // Ganti nama dari isNormalPart menjadi isFinishGoodPart
          />
        )}

        {savedSchedules.length > 0 ? (
          <div className="mt-12 sm:mt-20">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2
                className={`text-2xl sm:text-3xl font-semibold ${uiColors.text.accent}`}
              >
                Production Chart
              </h2>
            </div>
            {/* ProductionChart tidak terpengaruh oleh filter Part/Bulan/Shift */}
            <ProductionChart
              schedules={savedSchedules}
              onViewAllCharts={handleViewAllCharts}
            />
          </div>
        ) : (
          <div
            className={`mt-8 ${uiColors.bg.secondary} rounded-xl p-8 text-center`}
          >
            <p className={uiColors.text.tertiary}>
              Belum ada jadwal produksi yang dibuat
            </p>
          </div>
        )}

        {/* Chart Kedua: Perbandingan Rencana dan Actual Produksi */}
        {savedSchedules.length > 0 && (
          <div className="mt-12 sm:mt-20">
            <div
              className={`w-full ${uiColors.bg.secondary} rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3
                  className={`text-xl font-semibold ${uiColors.text.primary}`}
                >
                  {selectedPart
                    ? `Perbandingan Rencana dan Actual Produksi - ${selectedPart} (Per Hari)`
                    : "Perbandingan Rencana dan Actual Produksi per Bulan"}
                </h3>
                <button
                  onClick={() => navigate("/dashboard/all-production-monthly")}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                >
                  Lihat Semua
                </button>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                <div className="h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={React.useMemo(() => {
                        // Chart 2 tidak terpengaruh filter; gunakan seluruh savedSchedules dan tampilkan agregasi per-bulan
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

                        const initialMonthlyData: Record<
                          string,
                          { rencanaProduksi: number; actualProduksi: number }
                        > = {};
                        months.forEach(
                          (m) =>
                            (initialMonthlyData[m] = {
                              rencanaProduksi: 0,
                              actualProduksi: 0,
                            }),
                        );

                        const monthlyData = savedSchedules.reduce<
                          Record<
                            string,
                            { rencanaProduksi: number; actualProduksi: number }
                          >
                        >((acc, s) => {
                          const scheduleName = s.name || "";
                          const monthName = scheduleName.split(" ")[0];
                          if (!acc[monthName])
                            acc[monthName] = {
                              rencanaProduksi: 0,
                              actualProduksi: 0,
                            };

                          let totalRencana = 0;
                          let totalActual = 0;
                          s.schedule.forEach((item) => {
                            totalRencana += item.planningPcs || item.pcs || 0;
                            totalActual +=
                              item.hasilProduksi || item.actualPcs || 0;
                          });

                          acc[monthName].rencanaProduksi += totalRencana;
                          acc[monthName].actualProduksi += totalActual;
                          return acc;
                        }, initialMonthlyData);

                        return months.map((month) => ({
                          month,
                          rencanaProduksi: monthlyData[month].rencanaProduksi,
                          actualProduksi: monthlyData[month].actualProduksi,
                        }));
                      }, [savedSchedules])}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={
                          uiColors.bg.primary === "bg-gray-50"
                            ? "#e5e7eb"
                            : "#374151"
                        }
                      />
                      <XAxis
                        dataKey="month"
                        stroke={
                          uiColors.bg.primary === "bg-gray-50"
                            ? "#6b7280"
                            : "#9ca3af"
                        }
                        angle={0}
                        textAnchor="middle"
                        height={60}
                      />
                      <YAxis
                        stroke={
                          uiColors.bg.primary === "bg-gray-50"
                            ? "#6b7280"
                            : "#9ca3af"
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor:
                            uiColors.bg.primary === "bg-gray-50"
                              ? "#ffffff"
                              : "#1f2937",
                          border: `1px solid ${uiColors.bg.primary === "bg-gray-50" ? "#d1d5db" : "#374151"}`,
                          borderRadius: "0.5rem",
                          color:
                            uiColors.bg.primary === "bg-gray-50"
                              ? "#111827"
                              : "#f9fafb",
                        }}
                        labelStyle={{
                          color:
                            uiColors.bg.primary === "bg-gray-50"
                              ? "#111827"
                              : "#f9fafb",
                        }}
                        formatter={(value: any, name: string) => [
                          `${value} pcs`,
                          name === "rencanaProduksi"
                            ? "Rencana Produksi"
                            : name === "actualProduksi"
                              ? "Actual Produksi"
                              : name,
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="rencanaProduksi"
                        name="Rencana Produksi"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="actualProduksi"
                        name="Actual Produksi"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart ini tidak mengikuti filter part, jadi tidak perlu info per-part */}
            </div>
          </div>
        )}

        {/* Chart Ketiga: Perbandingan Rencana dan Actual Jam Produksi per Bulan */}
        {savedSchedules.length > 0 && (
          <div className="mt-12 sm:mt-20">
            <div
              className={`w-full ${uiColors.bg.secondary} rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3
                  className={`text-xl font-semibold ${uiColors.text.primary}`}
                >
                  {selectedPart
                    ? `Perbandingan Rencana dan Actual Jam Produksi - ${selectedPart} (Per Hari)`
                    : "Perbandingan Rencana dan Actual Jam Produksi per Bulan"}
                </h3>
                <button
                  onClick={() => navigate("/dashboard/allcharts")}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                >
                  Lihat Semua
                </button>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                <div className="h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={React.useMemo(() => {
                        // Chart 3 tidak terpengaruh filter; gunakan seluruh savedSchedules dan tampilkan agregasi per-bulan
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

                        const initialMonthlyData: Record<
                          string,
                          {
                            rencanaJamProduksi: number;
                            actualJamProduksi: number;
                          }
                        > = {};
                        months.forEach(
                          (m) =>
                            (initialMonthlyData[m] = {
                              rencanaJamProduksi: 0,
                              actualJamProduksi: 0,
                            }),
                        );

                        const monthlyData = savedSchedules.reduce<
                          Record<
                            string,
                            {
                              rencanaJamProduksi: number;
                              actualJamProduksi: number;
                            }
                          >
                        >((acc, s) => {
                          const scheduleName = s.name || "";
                          const monthName = scheduleName.split(" ")[0];
                          if (!acc[monthName])
                            acc[monthName] = {
                              rencanaJamProduksi: 0,
                              actualJamProduksi: 0,
                            };

                          let totalRencanaJam = 0;
                          let totalActualJam = 0;
                          s.schedule.forEach((item) => {
                            totalRencanaJam += item.planningHour || 0;
                            totalActualJam += item.jamProduksiAktual || 0;
                          });

                          acc[monthName].rencanaJamProduksi += totalRencanaJam;
                          acc[monthName].actualJamProduksi += totalActualJam;
                          return acc;
                        }, initialMonthlyData);

                        return months.map((month) => ({
                          month,
                          rencanaJamProduksi:
                            monthlyData[month].rencanaJamProduksi,
                          actualJamProduksi:
                            monthlyData[month].actualJamProduksi,
                        }));
                      }, [savedSchedules])}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={
                          uiColors.bg.primary === "bg-gray-50"
                            ? "#e5e7eb"
                            : "#374151"
                        }
                      />
                      <XAxis
                        dataKey="month"
                        stroke={
                          uiColors.bg.primary === "bg-gray-50"
                            ? "#6b7280"
                            : "#9ca3af"
                        }
                        angle={0}
                        textAnchor="middle"
                        height={60}
                      />
                      <YAxis
                        stroke={
                          uiColors.bg.primary === "bg-gray-50"
                            ? "#6b7280"
                            : "#9ca3af"
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor:
                            uiColors.bg.primary === "bg-gray-50"
                              ? "#ffffff"
                              : "#1f2937",
                          border: `1px solid ${uiColors.bg.primary === "bg-gray-50" ? "#d1d5db" : "#374151"}`,
                          borderRadius: "0.5rem",
                          color:
                            uiColors.bg.primary === "bg-gray-50"
                              ? "#111827"
                              : "#f9fafb",
                        }}
                        labelStyle={{
                          color:
                            uiColors.bg.primary === "bg-gray-50"
                              ? "#111827"
                              : "#f9fafb",
                        }}
                        formatter={(value: any, name: string) => [
                          `${value} jam`,
                          name === "rencanaJamProduksi"
                            ? "Rencana Jam Produksi"
                            : name === "actualJamProduksi"
                              ? "Actual Jam Produksi"
                              : name,
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="rencanaJamProduksi"
                        name="Rencana Jam Produksi"
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="actualJamProduksi"
                        name="Actual Jam Produksi"
                        fill="#ec4899"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart ini tidak mengikuti filter part, jadi tidak perlu info per-part */}
            </div>
          </div>
        )}
      </div>

      {/* Month/Year Picker Modal */}
      {showDatePickerModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl w-full max-w-sm p-4">
            {/* Year Navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setTempSelectedYear(tempSelectedYear - 1)}
                className="p-1 hover:bg-gray-700 rounded transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4 text-gray-400 hover:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div className="text-center">
                <span className="text-white font-bold text-xl">
                  {tempSelectedYear}
                </span>
              </div>

              <button
                onClick={() => setTempSelectedYear(tempSelectedYear + 1)}
                className="p-1 hover:bg-gray-700 rounded transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4 text-gray-400 hover:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Month Selection */}
            <div className="grid grid-cols-3 gap-1 mb-3">
              <button
                onClick={() => setTempSelectedMonth(null)}
                className={`p-2 rounded text-sm font-medium transition-all duration-200 ${
                  tempSelectedMonth === null
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                Semua
              </button>
              {MONTH_ABBREVIATIONS.map((monthAbbr, index) => (
                <button
                  key={index}
                  onClick={() => setTempSelectedMonth(index)}
                  className={`p-2 rounded text-sm font-medium transition-all duration-200 ${
                    tempSelectedMonth === index
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  {monthAbbr}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTempSelectedMonth(selectedMonth);
                  setTempSelectedYear(selectedYear);
                  setShowDatePickerModal(false);
                }}
                className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded transition-colors duration-200 text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDateSelection}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors duration-200 text-sm"
              >
                Pilih
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
